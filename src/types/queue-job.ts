import { z } from 'zod';

export const QueueJobSchema = z.object({
  messageId: z.string().cuid2(),
  from: z.string().min(1),
  body: z.string().min(1),
  receivedAt: z.date(),
});

export type QueueJob = z.infer<typeof QueueJobSchema>;
