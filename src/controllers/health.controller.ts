import type { FastifyReply, FastifyRequest } from 'fastify';
import { queue, worker } from '../configs';
import { ErrorHandler } from '../errors/error-handler';

export async function healthController(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { processed, failed } = worker.stats;

    reply.status(200).send({ queueSize: queue.size, processed, failed });
  } catch (error) {
    throw new ErrorHandler(500, 'Internal server error');
  }
}
