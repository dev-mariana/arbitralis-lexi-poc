import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHandler } from '../../src/errors/error-handler';
import { WhatsAppService } from '../../src/services/whatsapp-service';

const message = {
  to: '5511999990000',
  text: 'Olá, tudo bem?',
  correlationId: 'clh1a2b3c4d5e6f7g8h9i0j1k',
};

describe('WhatsAppService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should send a POST request with the correct payload', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);

    const service = new WhatsAppService('http://localhost:3000');
    await service.send(message);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/send-message',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(message),
      }),
    );
  });

  it('should throw ErrorHandler 502 when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal error',
      }),
    );

    const service = new WhatsAppService('http://localhost:3000');

    await expect(service.send(message)).rejects.toThrow(ErrorHandler);
    await expect(service.send(message)).rejects.toMatchObject({ statusCode: 502 });
  });
});
