class Node<T> {
  constructor(public value: T, public next?: Node<T>) {}
}

export class AsyncQueue<T> {
  private head: Node<T> | undefined;
  private tail: Node<T> | undefined;
  private active = 0;

  constructor(
    protected action: (task: T) => Promise<void>,
    protected batchSize = 5
  ) {}

  add(task: T) {
    this.enqueue(task);
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
      // TBD: Telemetry WithAsyncContext
      await this.action(item);
    } catch (e) {
      // TODO: proper telemetry
      console.error(e);
    } finally {
      this.active--;
      this.begin();
    }
  }
}
