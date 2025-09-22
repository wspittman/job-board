export type Bag = Record<string, unknown>;

export interface Context<T> {
  item: T;
  context?: {
    description: string;
    content: Bag;
  }[];
}
