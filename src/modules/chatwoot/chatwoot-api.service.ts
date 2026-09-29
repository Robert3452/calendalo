import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SelectItem } from './chatwoot.types';

@Injectable()
export class ChatwootApiService {
  private readonly log = new Logger(ChatwootApiService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(config: ConfigService) {
    // http://localhost:3000 en local. En el VPS: https://chat.tudominio.pe
    this.baseUrl = config.getOrThrow<string>('CHATWOOT_BASE_URL');
    // "Token de acceso" del agent bot
    this.token = config.getOrThrow<string>('CHATWOOT_BOT_TOKEN');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        api_access_token: this.token,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      this.log.error(
        `Chatwoot ${init.method ?? 'GET'} ${path} -> ${res.status}: ${body}`,
      );
      throw new Error(`Chatwoot API ${res.status}`);
    }
    return (await res.json()) as T;
  }

  private conv(accountId: number, conversationId: number) {
    return `/api/v1/accounts/${accountId}/conversations/${conversationId}`;
  }

  /** Nota interna: solo la ve la clienta en su bandeja, nunca el paciente. */
  async sendPrivateNote(
    accountId: number,
    conversationId: number,
    content: string,
  ) {
    return this.request(`${this.conv(accountId, conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        message_type: 'outgoing',
        private: true,
      }),
    });
  }

  /** Texto plano al paciente. */
  async sendText(accountId: number, conversationId: number, content: string) {
    return this.request(`${this.conv(accountId, conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        message_type: 'outgoing',
        private: false,
      }),
    });
  }

  /**
   * Mensaje con opciones. WhatsApp lo renderiza como botones (hasta 3 items)
   * o como lista (hasta 10). El title se trunca a 20 caracteres.
   */
  async sendSelect(
    accountId: number,
    conversationId: number,
    content: string,
    items: SelectItem[],
  ) {
    if (items.length === 0) throw new Error('sendSelect sin items');
    if (items.length > 10)
      throw new Error('WhatsApp admite máximo 10 opciones');

    const safeItems = items.map((i) => ({
      title: i.title.slice(0, 20),
      value: i.value,
    }));

    return this.request(`${this.conv(accountId, conversationId)}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        message_type: 'outgoing',
        private: false,
        content_type: 'input_select',
        content_attributes: { items: safeItems },
      }),
    });
  }

  async addLabels(accountId: number, conversationId: number, labels: string[]) {
    return this.request(`${this.conv(accountId, conversationId)}/labels`, {
      method: 'POST',
      body: JSON.stringify({ labels }),
    });
  }

  async getLabels(
    accountId: number,
    conversationId: number,
  ): Promise<{ payload: string[] }> {
    return this.request(`${this.conv(accountId, conversationId)}/labels`);
  }

  /** Quitar una etiqueta = reenviar la lista sin ella. */
  async removeLabel(accountId: number, conversationId: number, label: string) {
    const current = await this.getLabels(accountId, conversationId);
    const next = (current.payload ?? []).filter((l) => l !== label);
    return this.addLabels(accountId, conversationId, next);
  }

  /** Marca al contacto como nuevo o continuador. */
  async setContactAttributes(
    accountId: number,
    contactId: number,
    attrs: Record<string, unknown>,
  ) {
    return this.request(`/api/v1/accounts/${accountId}/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({ custom_attributes: attrs }),
    });
  }

  /** Handoff: saca la conversación de pending y se la pasa a la clienta. */
  async handoff(accountId: number, conversationId: number) {
    return this.request(
      `${this.conv(accountId, conversationId)}/toggle_status`,
      {
        method: 'POST',
        body: JSON.stringify({ status: 'open' }),
      },
    );
  }
}
