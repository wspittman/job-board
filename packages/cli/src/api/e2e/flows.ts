import { config } from "../config.ts";
import {
  formAsyncStep,
  formErrStep,
  formStep,
  formSucStep,
  resetSteps,
  type Step,
} from "./step.ts";

const { GREENHOUSE_IDS: ghIds, LEVER_IDS: lvIds } = config;

export const flows: Record<string, Step[]> = {
  quick: [
    formSucStep("", "Ping"),
    formStep("jobs", "List jobs", { expectBody: [] }),
  ],
  smoke: [
    ...resetSteps,
    formSucStep("company", "Import greenhouse company", {
      method: "PUT",
      asAdmin: true,
      body: { ats: "greenhouse", id: ghIds[0] },
    }),
    formSucStep("company", "Import lever company", {
      method: "PUT",
      asAdmin: true,
      body: { ats: "lever", id: lvIds[0] },
    }),
    formAsyncStep("refresh/jobs", "Refresh greenhouse jobs", {
      body: { ats: "greenhouse", companyId: ghIds[0] },
      asAdmin: true,
    }),
    formErrStep("job/apply", "Unknown job", "Job not found", {
      expectStatus: 404,
      query: { id: "unknown", companyId: "unknown" },
    }),
  ],
};
