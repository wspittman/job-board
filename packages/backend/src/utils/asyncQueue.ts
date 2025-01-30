import { AsyncExecutor } from "./asyncExecutor";
import { logError, withAsyncContext } from "./telemetry";

class Node<T> {
  constructor(public value: T, public next?: Node<T>) {}
}

export class AsyncQueue<T> {
  private head: Node<T> | undefined;
  private tail: Node<T> | undefined;
  private active = 0;

  constructor(
    protected name: string,
    protected action: (task: T) => Promise<void>,
    protected asyncExecutor?: AsyncExecutor,
    protected batchSize = 5
  ) {}

  add(task: T) {
    this.enqueue(task);
    this.begin();
  }

  addMany(tasks: T[]) {
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
        await this.action(item);
        this.asyncExecutor?.call();
      });
    } catch (error) {
      logError(error);
    } finally {
      this.active--;
      this.begin();
    }
  }
}
