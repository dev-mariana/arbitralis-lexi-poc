import { z } from 'zod';

export const WebhookPayloadSchema = z.object({
  messageId: z.string().cuid2(),
  from: z.string().min(1),
  body: z.string().min(1),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
