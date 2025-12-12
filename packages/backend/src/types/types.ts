export type Bag = Record<string, unknown>;

export interface Context<T> {
  item: T;
  context?: {
    description: string;
    content: Bag;
  }[];
}

// LOL GPT-5 wrote this
export type DeepPartialNullToUndef<T> =
  // keep functions
  T extends (...args: unknown[]) => unknown
    ? T
    : // arrays
      T extends (infer U)[]
      ? DeepPartialNullToUndef<U>[]
      : // objects
        T extends object
        ? {
            // optional properties
            [K in keyof T]?:
              | DeepPartialNullToUndef<NonNullable<T[K]>>
              | undefined;
          }
        : // primitives & unions: swap null with undefined
          [T] extends [null]
          ? undefined
          : T extends null
            ? undefined
            : // distribute over unions so `X | null` -> `X | undefined`
              T extends infer U
              ?
                  | (U extends null ? never : U)
                  | (undefined extends U ? undefined : never)
              : never;
