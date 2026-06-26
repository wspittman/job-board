import timers from "node:timers";
import { logError, logProperty, withAsyncContext } from "./telemetry.ts";

interface Options {
  onComplete?: () => void;
  concurrentLimit?: number;
  taskDelayMs?: number;
}

type OnGroupEnd = (hasFailures: boolean) => Promise<void>;

interface TaskGroup {
  remaining: number;
  hasFailures?: boolean;
  onGroupEnd: OnGroupEnd;
}

interface Item<T> {
  task: T;
  group?: TaskGroup;
}

class Node<T> {
  value: T;
  next?: Node<T>;
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
  #head: Node<Item<T>> | undefined;
  #tail: Node<Item<T>> | undefined;
  #active = 0;

  #name: string;
  #fn: (task: T) => Promise<void>;
  #onComplete?: () => void;
  #concurrentLimit: number;
  #taskDelayMs: number;

  /**
   * Creates a new AsyncQueue instance.
   * @param name The name of the queue for context tracking
   * @param fn The async function to process each task
   * @param options Configuration options for the queue
   */
  constructor(
    name: string,
    fn: (task: T) => Promise<void>,
    { concurrentLimit = 5, taskDelayMs = 0, onComplete }: Options = {},
  ) {
    this.#name = name;
    this.#fn = fn;
    this.#onComplete = onComplete;
    this.#concurrentLimit = concurrentLimit;
    this.#taskDelayMs = taskDelayMs;
  }

  /**
   * Adds multiple tasks to the queue and begins processing if possible.
   * @param tasks Array of tasks to be added to the queue
   * @param onGroupEnd Called after every task in this group settles
   */
  add(tasks: T[], onGroupEnd?: OnGroupEnd): void {
    logProperty(`Queue_${this.#name}_Add`, tasks.length);

    if (!tasks.length) {
      if (onGroupEnd) this.#endGroup(onGroupEnd);
      return;
    }

    const group: TaskGroup | undefined = onGroupEnd
      ? { remaining: tasks.length, onGroupEnd }
      : undefined;

    tasks.forEach((task) => this.#enqueue({ task, group }));
    this.#begin();
  }

  #begin() {
    // If there are no tasks or the batch is full, return
    if (!this.#head || this.#active >= this.#concurrentLimit) return;

    void this.#runTask(this.#dequeue());
    this.#begin();
  }

  #enqueue(item: Item<T>) {
    if (!this.#tail) {
      // First node
      this.#head = this.#tail = new Node(item);
    } else {
      // Add to existing tail
      this.#tail.next = new Node(item);
      this.#tail = this.#tail.next;
    }
  }

  #dequeue() {
    if (!this.#head) return;

    const current = this.#head;
    this.#head = current.next;

    if (!this.#head) {
      // This was the last node, set tail also
      this.#tail = undefined;
    }

    return current.value;
  }

  async #runTask(item?: Item<T>) {
    if (!item) return;

    let success = false;
    this.#active++;

    try {
      success = await withAsyncContext(this.#name, async () => {
        await this.#fn(item.task);
        this.#onComplete?.();
      });
    } catch (error) {
      success = false;
      logError(error);
    } finally {
      this.#active--;
      this.#updateGroup(!success, item.group);
      timers.setTimeout(() => this.#begin(), this.#taskDelayMs);
    }
  }

  #updateGroup(failed: boolean, group?: TaskGroup): void {
    if (!group) return;

    group.hasFailures ||= failed;
    group.remaining--;

    if (!group.remaining) {
      this.#endGroup(group.onGroupEnd, group.hasFailures);
    }
  }

  #endGroup(onGroupEnd: OnGroupEnd, hasFailures: boolean = false): void {
    try {
      void withAsyncContext(this.#name, async () => {
        await onGroupEnd(hasFailures);
      });
    } catch (error) {
      logError(error);
    }
  }
}
