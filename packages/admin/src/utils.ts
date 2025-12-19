export function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}
