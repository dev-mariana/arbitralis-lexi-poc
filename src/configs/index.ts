import pino from 'pino';
import { MemoryQueue } from '../queue/memory-queue';
import { LLMService } from '../services/llm-service';
import { WhatsAppService } from '../services/whatsapp-service';
import { LLMWorker } from '../workers/llm-worker';
import 'dotenv/config';

const logger = pino();
export const llmService = new LLMService();
export const whatsAppService = new WhatsAppService(
  process.env.WHATSAPP_MOCK_URL ?? 'http://localhost:3000',
);

export default logger;
export const queue = new MemoryQueue();
export const worker = new LLMWorker(queue, llmService, whatsAppService, logger);
