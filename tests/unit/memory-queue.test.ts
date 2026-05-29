import { describe, expect, it, vi } from 'vitest';
import { MemoryQueue } from '../../src/queue/memory-queue';

const makeJob = (id = 'clh1a2b3c4d5e6f7g8h9i0j1k') => ({
  messageId: id,
  from: '5511999990000',
  body: 'Olá',
  receivedAt: new Date(),
});

describe('MemoryQueue', () => {
  it('should enqueue and dequeue a job', () => {
    const queue = new MemoryQueue();
    const job = makeJob();

    queue.enqueue(job);

    expect(queue.size).toBe(1);
    expect(queue.dequeue()).toEqual(job);
    expect(queue.size).toBe(0);
  });

  it('should dequeue in FIFO order', () => {
    const queue = new MemoryQueue();
    const first = makeJob('clh1a2b3c4d5e6f7g8h9i0j1a');
    const second = makeJob('clh1a2b3c4d5e6f7g8h9i0j1b');

    queue.enqueue(first);
    queue.enqueue(second);

    expect(queue.dequeue()).toEqual(first);
    expect(queue.dequeue()).toEqual(second);
  });

  it('should return undefined when dequeuing from empty queue', () => {
    const queue = new MemoryQueue();
    expect(queue.dequeue()).toBeUndefined();
  });

  it('should emit a job event when a job is enqueued', () => {
    const queue = new MemoryQueue();
    const listener = vi.fn();
    const job = makeJob();

    queue.on('job', listener);
    queue.enqueue(job);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(job);
  });
});
