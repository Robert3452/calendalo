import { Injectable, Logger } from '@nestjs/common';
import { ChatwootApiService } from './chatwoot-api.service';
import { ChatwootWebhookPayload, IncomingMessage } from './chatwoot.types';
const LABEL_APPROVE = 'enviar-horarios';

@Injectable()
export class ChatwootHandlerService {
  private readonly log = new Logger(ChatwootHandlerService.name);

  /** Anti-duplicados en memoria. Reemplazar por tabla processed_events. */
  private readonly seen = new Set<string>();

  constructor(private readonly api: ChatwootApiService) {}

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

  /** Aquí entra tu motor de disponibilidad y el LLM. */
  private async onFreeText(msg: IncomingMessage): Promise<void> {
    this.log.log(`Mensaje de ${msg.phone}: ${msg.content}`);

    // 1. Clasificar intención con tu LLM.
    //    Si NO es sobre agenda -> handoff inmediato, el bot no improvisa.
    // const intent = await this.llm.classify(msg.content);
    // if (intent !== 'booking') {
    //   await this.api.sendPrivateNote(msg.accountId, msg.conversationId,
    //     'Mensaje fuera del tema de agenda. Te lo paso.');
    //   await this.api.handoff(msg.accountId, msg.conversationId);
    //   return;
    // }

    // 2. Tu motor actual: horarios fijos, blockers, policies, asistencias.
    // const slots = await this.scheduling.getAvailability(accountId, msg.patientType);

    // 3. Cruzar con freebusy de Google Calendar.
    // const busy = await this.calendar.getBusy(...);

    // 4. Crear held_slots con TTL y token opaco.
    // const items = held.map(h => ({ title: formatLima(h.startsAt), value: h.token }));

    const items = [
      { title: 'Lun 4:00 pm', value: 'hs_demo_001' },
      { title: 'Mié 6:00 pm', value: 'hs_demo_002' },
      { title: 'Vie 10:00 am', value: 'hs_demo_003' },
    ];

    // 5. Propuesta como NOTA PRIVADA. El paciente todavía no ve nada.
    const preview = items.map((i) => `• ${i.title}`).join('\n');
    await this.api.sendPrivateNote(
      msg.accountId,
      msg.conversationId,
      `Propuesta lista con ${items.length} horarios:\n${preview}\n\n` +
        `Aplica la etiqueta "${LABEL_APPROVE}" para enviarla al paciente.`,
    );

    // Guarda la propuesta en estado PENDING_APPROVAL con conversationId.
    // await this.proposals.create({ conversationId: msg.conversationId, items });
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

    const items = [
      { title: 'Lun 4:00 pm', value: 'hs_demo_001' },
      { title: 'Mié 6:00 pm', value: 'hs_demo_002' },
      { title: 'Vie 10:00 am', value: 'hs_demo_003' },
    ];

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
