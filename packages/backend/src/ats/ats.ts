import { Greenhouse } from "./greenhouse";
import { Lever } from "./lever";
import { ATS, AtsEndpoint } from "./types";

const atsEndpoints: Record<ATS, AtsEndpoint> = {
  [ATS.GREENHOUSE]: new Greenhouse(),
  [ATS.LEVER]: new Lever(),
};

export function getAts(ats: ATS) {
  return atsEndpoints[ats];
}
