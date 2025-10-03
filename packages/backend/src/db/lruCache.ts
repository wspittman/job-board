class Node<K, V> {
  key: K;
  value: V;
  prev?: Node<K, V>;
  next?: Node<K, V>;

  constructor(key: K, value: V) {
    this.key = key;
    this.value = value;
  }
}

export class LRUCache<K, V> {
  private cache: Map<K, Node<K, V>>;
  private head?: Node<K, V>;
  private tail?: Node<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error("Cache size must be greater than 0");
    }
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  private addToFront(node: Node<K, V>) {
    node.next = this.head;
    node.prev = undefined;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: Node<K, V>) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToFront(node: Node<K, V>) {
    this.removeNode(node);
    this.addToFront(node);
  }

  set(key: K, value: V): void {
    const node = this.cache.get(key);

    if (node) {
      node.value = value;
      this.moveToFront(node);
    } else {
      if (this.cache.size >= this.maxSize && this.tail) {
        this.cache.delete(this.tail.key);
        this.removeNode(this.tail);
      }

      const newNode = new Node(key, value);
      this.cache.set(key, newNode);
      this.addToFront(newNode);
    }
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key);

    if (node) {
      this.moveToFront(node);
      return node.value;
    }

    return undefined;
  }

  delete(key: K): boolean {
    const node = this.cache.get(key);

    if (node) {
      this.removeNode(node);
      this.cache.delete(key);
      return true;
    }

    return false;
  }

  clear(): void {
    this.cache.clear();
    this.head = undefined;
    this.tail = undefined;
  }

  size(): number {
    return this.cache.size;
  }
}
