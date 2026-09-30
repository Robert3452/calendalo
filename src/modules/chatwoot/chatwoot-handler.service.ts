import { Injectable, Logger } from '@nestjs/common';
import { ChatwootApiService } from './chatwoot-api.service';
import { ChatwootWebhookPayload, IncomingMessage } from './chatwoot.types';
import { AiService } from 'src/modules/ai/ai.service';
import { ConversationStore } from '../redis/conversationStore';
import { ChatMessageDto } from '../bookings/dto/chat.dto';
const LABEL_APPROVE = 'enviar-horarios';

@Injectable()
export class ChatwootHandlerService {
  private readonly log = new Logger(ChatwootHandlerService.name);

  /** Anti-duplicados en memoria. Reemplazar por tabla processed_events. */
  private readonly seen = new Set<string>();

  constructor(
    private readonly api: ChatwootApiService,
    private readonly llm: AiService,
    private readonly history: ConversationStore,
  ) {}

  async dispatch(p: ChatwootWebhookPayload): Promise<void> {
    switch (p.event) {
      case 'message_created':
        return this.onMessageCreated(p);
      case 'conversation_updated':
        return this.onConversationUpdated(p);
      default:
        return;
    }
  }

  // ---------------------------------------------------------------- entrada

  private async onMessageCreated(p: ChatwootWebhookPayload): Promise<void> {
    // Sin este filtro el bot se responde a sí mismo en bucle.
    if (p.message_type !== 'incoming') return;
    if (p.private) return;

    const key = `msg:${p.id}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);

    const msg = this.toIncoming(p);
    if (!msg) return;

    // El paciente tocó una opción del input_select
    if (msg.selectedValue) {
      await this.onSlotSelected(msg);
      return;
    }

    await this.onFreeText(msg);
  }

  private async onFreeText(msg: IncomingMessage): Promise<void> {
    this.log.log(`Mensaje de ${msg.phone}: ${msg.content}`);

    const intent = await this.llm.classify(msg.content);

    if (!['agendar', 'confirmar', 'mixto'].includes(intent)) {
      await this.api.sendPrivateNote(
        msg.accountId,
        msg.conversationId,
        `Mensaje fuera del tema de agenda (${intent}). Te lo paso.`,
      );
      await this.api.handoff(msg.accountId, msg.conversationId);
      return;
    }

    const accountId = 'fa20e4b8-18e5-4ad2-b173-8f831ac3b126';

    const history = await this.history.get(msg.accountId, msg.conversationId);

    const {
      reply,
      history: updated,
      slots,
    } = await this.llm.sendMessage(msg.content, accountId, history, {
      toolNames: ['check_availability'],
    });

    await this.history.set(
      msg.accountId,
      msg.conversationId,
      updated.map((el) => ({ ...el }) as ChatMessageDto),
    );

    if (!slots.length) {
      await this.api.sendText(msg.accountId, msg.conversationId, reply);
      return;
    }

    const items = slots.slice(0, 10).map((s) => ({
      title: s.label,
      value: s.slotStart,
    }));

    const preview = items.map((i) => `• ${i.title}`).join('\n');

    await this.api.sendPrivateNote(
      msg.accountId,
      msg.conversationId,
      `${reply}\n\nHorarios propuestos:\n${preview}\n\n` +
        `Aplica la etiqueta "${LABEL_APPROVE}" para enviarla al paciente.`,
    );
    await this.history.setProposal(msg.accountId, msg.conversationId, items);
  }
  /** El paciente eligió un horario. */
  private async onSlotSelected(msg: IncomingMessage): Promise<void> {
    this.log.log(`Slot elegido: ${msg.selectedValue}`);

    // 1. Validar held_slot vigente (SELECT ... FOR UPDATE).
    // 2. Re-verificar contra tu SQL y contra freebusy: la clienta pudo
    //    agendar a mano en ese hueco desde su celular.
    // 3. Crear el evento en Google Calendar con requestId idempotente.
    // 4. Persistir booking, liberar los held_slots hermanos.

    await this.api.sendText(
      msg.accountId,
      msg.conversationId,
      'Listo, tu cita quedó agendada. Te enviaré un recordatorio antes de la sesión.',
    );

    await this.api.addLabels(msg.accountId, msg.conversationId, [
      'cita-agendada',
    ]);
    await this.api.handoff(msg.accountId, msg.conversationId);
  }

  // ------------------------------------------------------- aprobación de la clienta

  /**
   * Ruta de aprobación que funciona en web y en la app móvil de Chatwoot.
   * La clienta aplica la etiqueta (directo o con una macro) y el bot envía.
   */
  private async onConversationUpdated(
    p: ChatwootWebhookPayload,
  ): Promise<void> {
    const labels = p.labels ?? p.conversation?.labels ?? [];
    if (!labels.includes(LABEL_APPROVE)) return;

    const accountId = p.account?.id;
    const conversationId = p.id ?? p.conversation?.id;
    if (!accountId || !conversationId) return;

    const key = `approve:${conversationId}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    setTimeout(() => this.seen.delete(key), 30_000);

    // Recupera la propuesta PENDING_APPROVAL de tu base.
    // const proposal = await this.proposals.findPending(conversationId);
    // if (!proposal) return;

    const items = await this.history.getProposal(accountId, conversationId);
    if (!items?.length) {
      await this.api.sendPrivateNote(
        accountId,
        conversationId,
        'No hay propuesta vigente. Pídele al paciente que escriba de nuevo.',
      );
      return;
    }
    await this.api.sendSelect(
      accountId,
      conversationId,
      'Estos son los horarios disponibles. Toca el que prefieras:',
      items,
    );

    // await this.proposals.markSent(proposal.id);
    await this.api.removeLabel(accountId, conversationId, LABEL_APPROVE);
  }

  // ---------------------------------------------------------------- helpers

  private toIncoming(p: ChatwootWebhookPayload): IncomingMessage | null {
    const accountId = p.account?.id;
    const conversationId = p.conversation?.id;
    const contact = p.conversation?.meta?.sender;
    if (!accountId || !conversationId || !contact) {
      this.log.warn('Payload incompleto, se ignora');
      return null;
    }

    return {
      accountId,
      inboxId: p.inbox?.id ?? p.conversation!.inbox_id,
      conversationId,
      contactId: contact.id,
      phone: contact.phone_number,
      contactName: contact.name,
      content: p.content ?? '',
      selectedValue: p.content_attributes?.submitted_values?.[0]?.value,
      patientType: contact.custom_attributes?.['patient_type'] as
        string | undefined,
    };
  }
}
