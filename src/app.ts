import Fastify, { type FastifyInstance } from 'fastify';
import 'dotenv/config';
import { errorHandlerMiddleware } from './errors/error-handler.middleware';
import { registerRoutes } from './routes/index';

export const app: FastifyInstance = Fastify({
  logger: {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  },
});

app.setErrorHandler(errorHandlerMiddleware);
app.register(registerRoutes, { prefix: '/api' });
