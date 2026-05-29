import type { FastifyInstance } from 'fastify';
import { healthController } from '../controllers/health.controller';
import { webhookController } from '../controllers/webhook.controller';
import { whatsAppController } from '../controllers/whatsapp.controller';

export function registerRoutes(app: FastifyInstance): void {
  app.post('/webhook', webhookController);
  app.post('/send-message', whatsAppController);
  app.get('/health', healthController);
}
