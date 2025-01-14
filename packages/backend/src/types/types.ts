export interface LLMContext<T> {
  item: T;
  context?: Record<string, unknown>;
}
