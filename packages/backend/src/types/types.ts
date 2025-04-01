export interface Context<T> {
  item: T;
  context?: {
    description: string;
    content: Record<string, unknown>;
  }[];
}
