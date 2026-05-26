import { z } from 'zod';

export const OutboundMessageSchema = z.object({
  to: z.string().min(1),
  text: z.string().min(1),
  correlationId: z.string().cuid2(),
});

export type OutboundMessage = z.infer<typeof OutboundMessageSchema>;
