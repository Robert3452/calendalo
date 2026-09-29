import OpenAI from 'openai';

export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'check_availability',
      description:
        'Consulta los horarios libres en una fecha. Usa "strip" para acotar a una parte del día; si se omite, devuelve todo el día.',
      parameters: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Fecha en formato YYYY-MM-DD',
          },
          strip: {
            type: ['string', 'null'],
            enum: ['manana', 'tarde', 'noche', null],
            description:
              'Parte del día, manana es mañana (de 8am a 12m), tarde (de 12:00 a 18:00) y. noche (de 18:00 a 22:00). Usar null (o omitir) para consultar el día completo.',
          },
        },
        required: ['startDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description:
        'Crea una reserva confirmada. Llamar SOLO después de que el usuario confirme explícitamente fecha y hora. startTime debe coincidir con un slotStart devuelto por check_availability.',
      parameters: {
        type: 'object',
        properties: {
          startTime: {
            type: 'string',
            description:
              'Inicio del slot en formato ISO completo (ej. "2026-09-18T15:00:00.000Z"), tomado de slotStart de check_availability.',
          },
          guestEmail: {
            type: 'string',
            description:
              'Correo del invitado que reserva (ej. "ana@mail.com").',
          },
        },
        required: ['startTime', 'guestEmail'],
      },
    },
  },
];
