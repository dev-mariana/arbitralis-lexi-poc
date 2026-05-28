import type { FastifyReply, FastifyRequest } from 'fastify';
import { queue, worker } from '../container';

export async function healthController(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { processed, failed } = worker.stats;

    reply.status(200).send({ queueSize: queue.size, processed, failed });
  } catch (error) {
    throw error;
  }
}
