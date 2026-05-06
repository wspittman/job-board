export const atsTypes = ["greenhouse", "lever"] as const;
export type ATS = (typeof atsTypes)[number];
