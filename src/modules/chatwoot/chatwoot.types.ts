export type ChatwootEvent =
  | 'message_created'
  | 'message_updated'
  | 'conversation_created'
  | 'conversation_updated'
  | 'conversation_status_changed'
  | 'webwidget_triggered';

export interface ChatwootWebhookPayload {
  event: ChatwootEvent;
  id?: number;
  content?: string;
  content_type?: string;
  content_attributes?: {
    // Respuesta del paciente a un input_select
    submitted_values?: Array<{ title?: string; value: string }>;
    [k: string]: unknown;
  };
  message_type?: 'incoming' | 'outgoing' | 'activity' | 'template';
  private?: boolean;
  account?: { id: number; name: string };
  inbox?: { id: number; name: string };
  conversation?: ChatwootConversation;
  sender?: { id: number; name?: string; type?: string; phone_number?: string };
  // Presente en conversation_updated
  labels?: string[];
  status?: string;
  meta?: ChatwootMeta;
  changed_attributes?: Array<
    Record<string, { previous_value: unknown; current_value: unknown }>
  >;
}

export interface ChatwootConversation {
  id: number;
  inbox_id: number;
  status: 'open' | 'pending' | 'resolved' | 'snoozed';
  can_reply: boolean;
  labels?: string[];
  meta?: ChatwootMeta;
  custom_attributes?: Record<string, unknown>;
  contact_inbox?: { source_id: string };
}

export interface ChatwootMeta {
  sender?: {
    id: number;
    name?: string;
    phone_number?: string;
    custom_attributes?: Record<string, unknown>;
  };
  assignee?: { id: number; name?: string } | null;
}

/** Lo que tu dominio necesita saber, ya extraído del payload crudo. */
export interface IncomingMessage {
  accountId: number;
  inboxId: number;
  conversationId: number;
  contactId: number;
  phone?: string;
  contactName?: string;
  content: string;
  /** value del item tocado, cuando el paciente responde un input_select */
  selectedValue?: string;
  patientType?: string;
}

export interface SelectItem {
  /** máx. 20 caracteres: límite de WhatsApp */
  title: string;
  /** token opaco que resuelves contra held_slots */
  value: string;
}
