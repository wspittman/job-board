import { fetcher } from "./fetcher.ts";
import { atsTypes } from "./types.ts";

export async function addCompanies(args: string[]): Promise<void> {
  let [ats, ...companyIds] = args;
  ats = ats?.toLowerCase() ?? "";
  companyIds = companyIds
    .map((id) => id.replace(",", "").trim())
    .filter((id) => !!id.length);

  if (!atsTypes.includes(ats) || !companyIds.length) {
    throw new Error("Invalid arguments");
  }

  console.log(`Adding ${companyIds.length} companies from ${ats}`);
  const result = await fetcher("companies", "PUT", { ats, ids: companyIds });
  console.log("Success", result);
}

export async function deleteJob(args: string[]): Promise<void> {
  const [companyId, id] = args;

  if (!companyId || !id) {
    throw new Error("Invalid arguments");
  }

  console.log(`Deleting job ${id} for company ${companyId}`);
  const result = await fetcher("job", "DELETE", { id, companyId });
  console.log("Success", result);
}
