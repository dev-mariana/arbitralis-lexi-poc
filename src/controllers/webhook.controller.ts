import type { FastifyReply, FastifyRequest } from 'fastify';
import { queue } from '../configs';
import { ErrorHandler } from '../errors/error-handler';
import { WebhookPayloadSchema } from '../types/index';

export async function webhookController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { messageId, from, body } = WebhookPayloadSchema.parse(request.body);

    queue.enqueue({ messageId, from, body, receivedAt: new Date() });

    reply.status(202).send({ received: true, messageId });
  } catch (error) {
    throw new ErrorHandler(400, error instanceof Error ? error.message : 'Invalid payload');
  }
}
