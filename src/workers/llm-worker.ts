import { setTimeout as sleep } from 'node:timers/promises';
import { maskPhone } from '../helpers/mask-phone';
import type { ILogger } from '../interfaces/logger.interface';
import type { MemoryQueue } from '../queue/memory-queue';
import type { LLMService } from '../services/llm-service';
import type { WhatsAppService } from '../services/whatsapp-service';
import type { QueueJob } from '../types/index';

export class LLMWorker {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly BASE_BACKOFF_MS = 1_000;

  private running = false;
  private processed = 0;
  private failed = 0;

  constructor(
    private readonly queue: MemoryQueue,
    private readonly llmService: LLMService,
    private readonly whatsAppService: WhatsAppService,
    private readonly logger: ILogger,
  ) {}

  start(): void {
    this.running = true;
    this.queue.on('job', () => this.processNext());
    this.logger.info('LLM worker started');
  }

  stop(): void {
    this.running = false;
    this.queue.removeAllListeners('job');
    this.logger.info('LLM worker stopped');
  }

  get stats(): { processed: number; failed: number } {
    return { processed: this.processed, failed: this.failed };
  }

  private async processNext(): Promise<void> {
    if (!this.running) return;

    const job = this.queue.dequeue();
    if (!job) return;

    await this.processWithRetry(job);
  }

  private async executeJob(job: QueueJob): Promise<void> {
    const text = await this.llmService.call(job.body);

    await this.whatsAppService.send({
      to: job.from,
      text,
      correlationId: job.messageId,
    });
  }

  private async processWithRetry(job: QueueJob): Promise<void> {
    const logCtx = { messageId: job.messageId, from: maskPhone(job.from) };

    for (let attempt = 1; attempt <= LLMWorker.MAX_ATTEMPTS; attempt++) {
      try {
        await this.executeJob(job);

        this.processed++;
        this.logger.info(logCtx, 'Job processed successfully');

        return;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const isLastAttempt = attempt === LLMWorker.MAX_ATTEMPTS;

        this.logger.warn({ ...logCtx, attempt, err: error.message }, 'Job attempt failed');

        if (isLastAttempt) {
          this.failed++;
          this.logger.error(logCtx, 'Job discarded after max retries');
          
          return;
        }

        await sleep(LLMWorker.BASE_BACKOFF_MS * 2 ** (attempt - 1));
      }
    }
  }
}
