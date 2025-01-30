import { AsyncExecutor } from "./asyncExecutor";
import { logError, withAsyncContext } from "./telemetry";

class Node<T> {
  constructor(public value: T, public next?: Node<T>) {}
}

/**
 * Manages a queue of asynchronous tasks with batch processing capabilities.
 * Tasks are processed in FIFO order with a configurable batch size limit.
 */
export class AsyncQueue<T> {
  private head: Node<T> | undefined;
  private tail: Node<T> | undefined;
  private active = 0;

  /**
   * Creates a new AsyncQueue instance.
   * @param name - The name of the queue for context tracking
   * @param fn - The async function to process each task
   * @param onComplete - Optional executor to run on task completion
   * @param batchSize - Maximum number of concurrent tasks (default: 5)
   */
  constructor(
    protected name: string,
    protected fn: (task: T) => Promise<void>,
    protected onComplete?: AsyncExecutor,
    protected batchSize = 5
  ) {}

  /**
   * Adds multiple tasks to the queue and begins processing if possible.
   * @param tasks - Array of tasks to be added to the queue
   */
  add(tasks: T[]) {
    tasks.forEach((task) => this.enqueue(task));
    this.begin();
  }

  private begin() {
    // If there are no tasks or the batch is full, return
    if (!this.head || this.active >= this.batchSize) return;

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
      withAsyncContext(this.name, async () => {
        await this.fn(item);
        this.onComplete?.call();
      });
    } catch (error) {
      logError(error);
    } finally {
      this.active--;
      this.begin();
    }
  }
}
