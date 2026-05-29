import Fastify, { type FastifyInstance } from 'fastify';
import { registerRoutes } from './routes/index';

export const app: FastifyInstance = Fastify({
  logger: {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  },
});

app.register(registerRoutes, { prefix: '/api' });
