import { config } from "../config.ts";
import { atsTypes, type ATS } from "../portal/atsConsts.ts";
import type { HttpMethod } from "../types.ts";

const { GREENHOUSE_IDS: ghIds, LEVER_IDS: lvIds } = config;

const atsMap: Record<ATS, string[]> = {
  greenhouse: ghIds,
  lever: lvIds,
  ashby: [],
};
export const ats = "greenhouse" as const;
export const companyId = atsMap[ats][0];
export const companyIds = atsMap[ats];

// #region Request

interface ReqOpts {
  asAdmin?: boolean;
  query?: Record<string, string>;
  body?: unknown;
}

interface Req extends ReqOpts {
  method: HttpMethod;
  path: string;
}

export const req = (
  method: HttpMethod,
  path: string,
  opts: ReqOpts,
  asAdmin: boolean,
): Req => ({ method, path, asAdmin, ...opts });

req.get = (path: string, opts: ReqOpts = {}): Req =>
  req("GET", path, opts, false);
req.post = (path: string, opts: ReqOpts = {}): Req =>
  req("POST", path, opts, true);
req.put = (path: string, opts: ReqOpts = {}): Req =>
  req("PUT", path, opts, true);
req.del = (path: string, opts: ReqOpts = {}): Req =>
  req("DELETE", path, opts, true);

// #endregion

// #region Results

interface Res {
  status: number;
  value?: unknown;
}

export const res = (status: number, value?: unknown): Res => ({
  status,
  value,
});
res.ok = (value?: unknown): Res => res(200, value);
res.err = (message: string, status = 400): Res =>
  res(status, { status: "error", statusCode: status, message });
res.accepted = res(202, "Accepted");

// #endregion

/// #region Step

/**
 * Defines a single step in an end-to-end flow.
 */
export interface Step {
  name: string;
  req: Req;
  res: Res;
  // Display this message and wait on user input before proceeding
  confirm?: string;
}

export const formStep = (
  name: string,
  req: Req,
  res: Res,
  confirm?: string,
): Step => ({ name, req, res, confirm });

export const oneAddEachAts = atsTypes.map((ats) =>
  formStep(
    `Add ${ats} company`,
    req.put("company", { asAdmin: false, body: { ats, id: atsMap[ats][0] } }),
    res.ok(),
  ),
);

export const allAddAts = atsTypes.map((ats) =>
  formStep(
    `Add all ${ats} companies`,
    req.put("companies", {
      body: { ats, ids: atsMap[ats] },
    }),
    res.ok(),
    `Verify ${ats} companies added`,
  ),
);

export const allDelAts = atsTypes.flatMap((ats) =>
  atsMap[ats].map((id) =>
    formStep(
      `Delete ${ats} company ${id}`,
      req.del("company", { body: { ats, id } }),
      res.ok(),
    ),
  ),
);
const lastDelStep = allDelAts.at(-1);
if (lastDelStep) {
  lastDelStep.confirm = "Verify companies deleted";
}

// #endregion
