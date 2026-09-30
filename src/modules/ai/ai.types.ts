export interface AvailabilitySlot {
  slotStart: string; // ISO en UTC
  slotEnd: string;
  time: string; // "16:30" en hora de Lima
  label: string; // "Lun 4:00 pm", listo para el botón de WhatsApp
}
