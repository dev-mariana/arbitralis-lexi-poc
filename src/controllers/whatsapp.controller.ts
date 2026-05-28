import type { FastifyReply, FastifyRequest } from 'fastify';
import { OutboundMessageSchema } from '../types/index';

export async function whatsAppController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { to, correlationId } = OutboundMessageSchema.parse(request.body);

    request.log.info({ to, correlationId }, 'Outbound message received');

    reply.status(200).send({ delivered: true });
  } catch (error) {
    throw error;
  }
}
