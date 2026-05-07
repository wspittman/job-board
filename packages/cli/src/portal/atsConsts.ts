export const atsTypes = ["ashby", "greenhouse", "lever"] as const;
export type ATS = (typeof atsTypes)[number];
