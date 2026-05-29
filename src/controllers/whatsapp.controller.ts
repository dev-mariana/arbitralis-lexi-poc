import logger from '@/configs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorHandler } from '../errors/error-handler';
import { OutboundMessageSchema } from '../types/index';

export async function whatsAppController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { to, correlationId } = OutboundMessageSchema.parse(request.body);

    logger.info({ to, correlationId }, 'Outbound message received');

    reply.status(200).send({ delivered: true });
  } catch (error) {
    throw new ErrorHandler(400, error instanceof Error ? error.message : 'Invalid payload');
  }
}
