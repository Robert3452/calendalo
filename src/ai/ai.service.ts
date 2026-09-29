import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import {
  IQueryAvailability,
  IToolCreateBooking,
  ToolExecutorService,
} from './tool-executor.service';
import { tools } from './tools.definition';
import { ChatMessageDto } from 'src/modules/bookings/dto/chat.dto';

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;
@Injectable()
export class AiService {
  private client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,

    baseURL: 'https://api.groq.com/openai/v1',
  });

  constructor(private executor: ToolExecutorService) {}

  private sanitizeHistory(history: ChatMessageDto[]): Msg[] {
    return history.map((m): Msg => {
      switch (m.role) {
        case 'tool':
          return {
            role: 'tool',
            tool_call_id: m.tool_call_id ?? '',
            content: m.content ?? '',
          };
        case 'assistant':
          return {
            role: 'assistant',
            content: m.content ?? null,
            ...(m.tool_calls?.length
              ? {
                  tool_calls:
                    m.tool_calls as OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
                }
              : {}),
          };
        default:
          return { role: 'user', content: m.content ?? '' };
      }
    });
  }
  async sendMessage(
    userMessage: string,
    accountId: string,
    history: ChatMessageDto[] = [],
  ) {
    const now = new Date();
    const today: string = now.toISOString().split('T')[0];
    console.log(typeof history);
    console.log(JSON.stringify(history));

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `Eres un asistente de agendamiento, Hoy es ${today}, zona horaria America Latina Lima Perú. 
                Es importante que resuelvas fechas realtivas("jueves", "mañana","pasado mañana") usando esa fecha. 
                NUNCA crees una reserva sin que el usuario confirme explícitamente hora y fecha o confirme ("Si agéndalo a esa hora","A esa hora está bien" o algo similar).`,
      },
      ...this.sanitizeHistory(history),
      { role: 'user', content: userMessage },
    ];
    // First call: the LLM decides if uses the tool
    let response = await this.client.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages,
      tools: tools,
    });

    let message = response.choices[0].message;
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    // start the loop if the llm calls tools, execute it

    while (message.tool_calls && iterations < MAX_ITERATIONS) {
      iterations++;
      messages.push(message);

      for (const call of message.tool_calls) {
        let result: unknown;
        if (call.type !== 'function') continue;

        const toolName = call.function.name;
        try {
          const args = JSON.parse(call.function.arguments) as
            IQueryAvailability | IToolCreateBooking;
          result = await this.executor.execute(toolName, {
            ...args,
            accountId,
          });
        } catch (error) {
          result = {
            success: false,
            summary:
              error instanceof Error
                ? error.message
                : 'Error ejecutando la herramienta',
          };
        }
        // retrieve the result from the tool to the history
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      // new call to the LLM now build the real results

      response = await this.client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages,
        tools: tools,
      });

      message = response.choices[0].message;
    }

    messages.push(message);

    return {
      reply: message.content,
      history: messages.slice(1),
    };
  }
}
