import type { Context } from "./packagePortal";

export interface MatchResult {
  // 0..1, only present for fuzzy matches
  score?: number;
  match?: boolean;
  badMatch?: boolean;
  badFind?: boolean;
  badOmit?: boolean;
}

export type MatchFunction = (
  actual: unknown,
  expected: unknown
) => Promise<MatchResult>;

export interface Source<T> {
  name: string;
  input: Context<T>;
  ground: T;
}
