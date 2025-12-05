import { setTimeout } from "node:timers";
import { AsyncExecutor } from "./asyncExecutor.ts";
import { logError, logProperty, withAsyncContext } from "./telemetry.ts";

interface Options {
  onComplete?: AsyncExecutor;
  concurrentLimit?: number;
  taskDelayMs?: number;
}

class Node<T> {
  public value: T;
  public next?: Node<T>;
  constructor(value: T, next?: Node<T>) {
    this.value = value;
    this.next = next;
  }
}

/**
 * Manages a queue of asynchronous tasks with batch processing capabilities.
 * Tasks are processed in FIFO order with a configurable batch size limit.
 */
export class AsyncQueue<T> {
  private head: Node<T> | undefined;
  private tail: Node<T> | undefined;
  private active = 0;

  protected name: string;
  protected fn: (task: T) => Promise<void>;
  protected onComplete?: AsyncExecutor;
  protected concurrentLimit: number;
  protected taskDelayMs: number;

  /**
   * Creates a new AsyncQueue instance.
   * @param name - The name of the queue for context tracking
   * @param fn - The async function to process each task
   * @param options - Configuration options for the queue
   */
  constructor(
    name: string,
    fn: (task: T) => Promise<void>,
    { concurrentLimit = 5, taskDelayMs = 0, onComplete }: Options = {}
  ) {
    this.name = name;
    this.fn = fn;
    this.onComplete = onComplete;
    this.concurrentLimit = concurrentLimit;
    this.taskDelayMs = taskDelayMs;
  }

  /**
   * Adds multiple tasks to the queue and begins processing if possible.
   * @param tasks - Array of tasks to be added to the queue
   */
  add(tasks: T[]): void {
    logProperty(`Queue_${this.name}_Add`, tasks.length);
    tasks.forEach((task) => this.enqueue(task));
    this.begin();
  }

  private begin() {
    // If there are no tasks or the batch is full, return
    if (!this.head || this.active >= this.concurrentLimit) return;

    this.runTask(this.dequeue());
    this.begin();
  }

  private enqueue(task: T) {
    if (!this.tail) {
      // First node
      this.head = this.tail = new Node(task);
    } else {
      // Add to existing tail
      this.tail.next = new Node(task);
      this.tail = this.tail.next;
    }
  }

  private dequeue() {
    if (!this.head) return;

    const current = this.head;
    this.head = current.next;

    if (!this.head) {
      // This was the last node, set tail also
      this.tail = undefined;
    }

    return current.value;
  }

  private async runTask(item?: T) {
    try {
      if (!item) return;
      this.active++;
      await withAsyncContext(this.name, async () => {
        await this.fn(item);
        this.onComplete?.call();
      });
    } catch (error) {
      logError(error);
    } finally {
      this.active--;
      setTimeout(() => this.begin(), this.taskDelayMs);
    }
  }
}
