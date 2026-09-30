export const INTENTS = [
  'agendar',
  'reprogramar',
  'confirmar',
  'administrativo',
  'mixto',
  'otro',
] as const;

export type Intent = (typeof INTENTS)[number];

/** Cualquier salida inesperada del modelo cae en 'otro', que rutea al humano. */
export function parseIntent(raw: string | null | undefined): Intent {
  const v = (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-záéíóú]/g, '');
  return (INTENTS as readonly string[]).includes(v) ? (v as Intent) : 'otro';
}
