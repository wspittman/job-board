import type { NumBag } from "../types/types.ts";

export function addNumBags<T extends NumBag>(acc: T, b: T): T {
  for (const key in b) {
    acc[key] = ((acc[key] ?? 0) + (b[key] ?? 0)) as T[Extract<keyof T, string>];
  }
  return acc;
}

export function truncate(n: number, digits: number = 4): number {
  return Number(n.toFixed(digits));
}

export function calcF1(precision: number, recall: number): number {
  return truncate((2 * (precision * recall)) / (precision + recall || 1));
}

export function cost(
  inTokens: number,
  outTokens: number,
  inCost: number,
  outCost: number
) {
  return truncate(
    // Cost is per million tokens
    (inTokens * inCost) / 1_000_000 + (outTokens * outCost) / 1_000_000,
    8
  );
}
