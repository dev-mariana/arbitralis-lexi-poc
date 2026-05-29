import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app';

const validPayload = {
  messageId: 'clh1a2b3c4d5e6f7g8h9i0j1k',
  from: '5511999990000',
  body: 'Quero negociar',
};

afterAll(async () => {
  await app.close();
});

describe('POST /api/webhook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 202 with received and messageId for valid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/webhook',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({
      received: true,
      messageId: validPayload.messageId,
    });
  });

  it('should return 400 for missing required fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/webhook',
      payload: { from: '5511999990000' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 for invalid messageId (not cuid2)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/webhook',
      payload: { ...validPayload, messageId: 'not-a-cuid2' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should enqueue the job with correct fields', async () => {
    const { queue } = await import('../../src/configs');
    const enqueueSpy = vi.spyOn(queue, 'enqueue');

    await app.inject({
      method: 'POST',
      url: '/api/webhook',
      payload: validPayload,
    });

    expect(enqueueSpy).toHaveBeenCalledOnce();
    expect(enqueueSpy).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: validPayload.messageId }),
    );
  });
});

describe('GET /api/health', () => {
  it('should return queue stats', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      queueSize: expect.any(Number),
      processed: expect.any(Number),
      failed: expect.any(Number),
    });
  });
});
