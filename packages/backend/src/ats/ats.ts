import type { ATS } from "../db/models";
import { Greenhouse } from "./greenhouse";
import { Lever } from "./lever";
import type { AtsEndpoint } from "./types";

const atsEndpoints: Record<ATS, AtsEndpoint> = {
  greenhouse: new Greenhouse(),
  lever: new Lever(),
};

export function getAts(ats: ATS) {
  return atsEndpoints[ats];
}

export function getAtsList(): ATS[] {
  return Object.keys(atsEndpoints) as ATS[];
}
