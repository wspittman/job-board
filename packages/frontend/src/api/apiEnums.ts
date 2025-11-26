const workTimeBasis = {
  full_time: "Full-time",
  part_time: "Part-time",
  per_diem: "Per diem",
} as const;

export type WorkTimeBasis = keyof typeof workTimeBasis;
export const workTimeBasisOptions = Object.entries(workTimeBasis).map(toOption);

export function toWorkTimeBasis(value: unknown): WorkTimeBasis | undefined {
  if (typeof value !== "string") return undefined;
  const val = value.trim() as WorkTimeBasis;
  return workTimeBasis[val] ? val : undefined;
}

export function toWorkTimeBasisLabel(value: unknown): string {
  const val = toWorkTimeBasis(value);
  return val ? workTimeBasis[val] : String(value);
}

function toOption([value, label]: [string, string]) {
  return { value, label };
}
