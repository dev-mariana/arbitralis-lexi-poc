import { app } from './app';
import { worker } from './configs';

const port = Number(process.env['PORT'] ?? 3000);

async function stop(): Promise<void> {
  app.log.info('Graceful shutdown initiated');
  worker.stop();
  await app.close();
  process.exit(0);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);

try {
  await app.listen({ port });
  worker.start();
} catch (error) {
  app.log.error(error, 'Failed to start server');
  process.exit(1);
}
