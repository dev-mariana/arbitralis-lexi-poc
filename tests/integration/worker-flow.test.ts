import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app';
import { llmService, whatsAppService, worker } from '../../src/configs';

const basePayload = {
  messageId: 'clh1a2b3c4d5e6f7g8h9i0j1k',
  from: '5511999990000',
  body: 'Quero negociar minha dívida',
};

beforeAll(() => {
  worker.start();
});

afterAll(async () => {
  worker.stop();
  await app.close();
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Fluxo completo: webhook → fila → worker → outbound', () => {
  it('deve processar o job e chamar o WhatsApp com a resposta do LLM', async () => {
    vi.spyOn(llmService, 'call').mockResolvedValue('Resposta simulada para: "Quero negociar minha dívida"');
    const sendSpy = vi.spyOn(whatsAppService, 'send').mockResolvedValue(undefined);

    const before = worker.stats.processed;

    await app.inject({
      method: 'POST',
      url: '/api/webhook',
      payload: basePayload,
    });

    await vi.waitFor(() => expect(worker.stats.processed).toBe(before + 1), { timeout: 5_000 });

    expect(sendSpy).toHaveBeenCalledOnce();
    expect(sendSpy).toHaveBeenCalledWith({
      to: basePayload.from,
      text: 'Resposta simulada para: "Quero negociar minha dívida"',
      correlationId: basePayload.messageId,
    });
  });
});

describe('Falha do LLM → retry com back-off → job descartado', () => {
  it('deve tentar 3 vezes e descartar o job quando o LLM sempre falha', async () => {
    const callSpy = vi.spyOn(llmService, 'call').mockRejectedValue(new Error('LLM timeout'));

    const before = worker.stats.failed;

    await app.inject({
      method: 'POST',
      url: '/api/webhook',
      payload: { ...basePayload, messageId: 'clh1a2b3c4d5e6f7g8h9i0j1l' },
    });

    // back-off: 1s (após tentativa 1) + 2s (após tentativa 2) = 3s mínimo
    await vi.waitFor(() => expect(worker.stats.failed).toBe(before + 1), { timeout: 10_000 });

    expect(callSpy).toHaveBeenCalledTimes(3);
  });
});
