import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorHandler } from '../../src/errors/error-handler';
import { LLMService } from '../../src/services/llm-service';

const mockSleep = vi.hoisted(() => vi.fn<() => Promise<void>>().mockResolvedValue(undefined));

vi.mock('node:timers/promises', () => ({
  setTimeout: mockSleep,
}));

describe('LLMService', () => {
  beforeEach(() => {
    mockSleep.mockClear();
    vi.restoreAllMocks();
  });

  it('should return a simulated response when successful', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const service = new LLMService();
    const result = await service.call('Preciso de ajuda');

    expect(result).toContain('Preciso de ajuda');
  });

  it('should throw ErrorHandler 503 when failure rate is triggered', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1); 

    const service = new LLMService();

    await expect(service.call('teste')).rejects.toThrow(ErrorHandler);
    await expect(service.call('teste')).rejects.toMatchObject({ statusCode: 503 });
  });

  it('should call sleep with a delay between MIN and MAX bounds', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); 

    const service = new LLMService();
    await service.call('teste');

    expect(mockSleep).toHaveBeenCalledOnce();
    const [ms] = mockSleep.mock.calls[0] as [number];
    expect(ms).toBeGreaterThanOrEqual(2_000);
    expect(ms).toBeLessThanOrEqual(8_000);
    expect(ms).toBe(5_000);
  });
});
