export interface Context<T> {
  item: T;
  context?: Record<string, unknown>;
}
