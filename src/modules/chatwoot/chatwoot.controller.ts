import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ChatwootHandlerService } from './chatwoot-handler.service';
import * as chatwootTypes from './chatwoot.types';

@Controller('chatwoot')
export class ChatwootController {
  private readonly log = new Logger(ChatwootController.name);

  constructor(private readonly handler: ChatwootHandlerService) {}

  /**
   * URL que va en el agent bot.
   * Local:  http://host.docker.internal:3001/api/chatwoot
   *         (requiere SAFE_FETCH_ALLOW_PRIVATE_NETWORK=true en Chatwoot)
   * Prod:   https://api.tudominio.pe/api/chatwoot
   *
   * Responde 200 de inmediato. Chatwoot no espera, y si tardas más de unos
   * segundos reintenta y te duplica el evento.
   */
  @Post()
  @HttpCode(200)
  handle(@Body() payload: chatwootTypes.ChatwootWebhookPayload) {
    // No await: el trabajo real corre en segundo plano.
    this.handler.dispatch(payload).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.log.error(`dispatch falló: ${message}`, stack);
    });

    return { ok: true };
  }
}
