import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { formatZodError } from '../helpers/format-zod-error';
import { ErrorHandler } from './error-handler';

export function errorHandlerMiddleware(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ErrorHandler) {
    reply.status(error.statusCode).send({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    reply.status(400).send({ error: 'Validation failed', details: formatZodError(error) });
    return;
  }

  reply.status(500).send({ error: 'Internal server error' });
}
