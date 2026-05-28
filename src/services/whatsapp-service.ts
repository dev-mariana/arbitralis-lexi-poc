import type { OutboundMessage } from '../types/index.js';

export class WhatsAppService {
  private static readonly TIMEOUT_MS = 5_000;

  constructor(private readonly mockUrl: string) {}

  async send(message: OutboundMessage): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WhatsAppService.TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch(`${this.mockUrl}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `Unexpected status from mock-whatsapp: ${response.status}${detail ? ` — ${detail}` : ''}`,
      );
    }
  }
}
