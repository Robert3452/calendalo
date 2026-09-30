/**
 * Todo se persiste en UTC y se presenta en la zona de la cuenta.
 * toISOString() devuelve UTC: usarlo para mostrar corre la fecha 5 horas
 * en Perú, y a partir de las 7pm muestra el día siguiente.
 */
export const DEFAULT_TZ = 'America/Lima';

/** "2026-09-29" en la zona indicada. en-CA da el formato ISO de fecha. */
export function todayIn(
  tz: string = DEFAULT_TZ,
  at: Date = new Date(),
): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(at);
}

/** "16:30" */
export function hhmm(d: Date | string, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(d));
}

/** "29/09/2026" */
export function ddmmyyyy(d: Date | string, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: tz,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(d));
}

/** "lunes 29 de septiembre" */
export function longDate(d: Date | string, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(d));
}

/** "Lun 4:00 pm" — máx. 20 caracteres, para los items de WhatsApp. */
export function slotLabel(d: Date | string, tz: string = DEFAULT_TZ): string {
  const parts = new Intl.DateTimeFormat('es-PE', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
  return parts.replace(/\./g, '').slice(0, 20);
}
