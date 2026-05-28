import { EventEmitter } from 'node:events';
import type { QueueJob } from '../types/index.js';

export class MemoryQueue extends EventEmitter {
  private readonly jobs: QueueJob[] = [];

  enqueue(job: QueueJob): void {
    this.jobs.push(job);
    this.emit('job', job);
  }

  dequeue(): QueueJob | undefined {
    return this.jobs.shift();
  }

  get size(): number {
    return this.jobs.length;
  }
}
