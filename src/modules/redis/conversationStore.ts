import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ChatMessageDto } from '../bookings/dto/chat.dto';
import { SelectItem } from '../chatwoot/chatwoot.types';

export function trim(history: ChatMessageDto[], max = 20): ChatMessageDto[] {
  if (history.length <= max) return history;
  let start = history.length - max;
  // avanza hasta un mensaje user o un assistant sin tool_calls pendientes
  while (start < history.length) {
    const m = history[start];
    if (m.role === 'user') break;
    start++;
  }
  return history.slice(start);
}

@Injectable()
export class ConversationStore {
  private readonly TTL = 60 * 60 * 24; // 24h, igual que la ventana de WhatsApp

  constructor(@Inject('REDIS') private redis: Redis) {}

  private key(accountId: number, conversationId: number) {
    return `cw:hist:${accountId}:${conversationId}`;
  }

  async get(
    accountId: number,
    conversationId: number,
  ): Promise<ChatMessageDto[]> {
    const raw = await this.redis.get(this.key(accountId, conversationId));
    return raw ? (JSON.parse(raw) as ChatMessageDto[]) : [];
  }

  async set(
    accountId: number,
    conversationId: number,
    history: ChatMessageDto[],
  ) {
    await this.redis.set(
      this.key(accountId, conversationId),
      JSON.stringify(trim(history)),
      'EX',
      this.TTL,
    );
  }

  async clear(accountId: number, conversationId: number) {
    await this.redis.del(this.key(accountId, conversationId));
  }
  async setProposal(
    accountId: number,
    conversationId: number,
    items: SelectItem[],
  ) {
    await this.redis.set(
      `cw:prop:${accountId}:${conversationId}`,
      JSON.stringify(items),
      'EX',
      1800, // 30 min
    );
  }

  async getProposal(
    accountId: number,
    conversationId: number,
  ): Promise<SelectItem[] | null> {
    const raw = await this.redis.get(`cw:prop:${accountId}:${conversationId}`);
    return raw ? (JSON.parse(raw) as SelectItem[]) : null;
  }
}
