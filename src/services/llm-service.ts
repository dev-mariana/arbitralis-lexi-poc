import { setTimeout as sleep } from 'node:timers/promises';
import { ErrorHandler } from '../errors/error-handler';

export class LLMService {
  private static readonly MIN_DELAY_MS = 2_000;
  private static readonly MAX_DELAY_MS = 8_000;
  private static readonly FAILURE_RATE = 0.2;

  async call(body: string): Promise<string> {
    await this.randomDelay();

    if (Math.random() < LLMService.FAILURE_RATE) {
      throw new ErrorHandler(503, 'LLM timeout');
    }

    return `Resposta simulada para: "${body}"`;
  }

  private randomDelay(): Promise<void> {
    const ms =
      LLMService.MIN_DELAY_MS + Math.random() * (LLMService.MAX_DELAY_MS - LLMService.MIN_DELAY_MS);

    return sleep(ms);
  }
}
