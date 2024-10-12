export function splitJobs<T>(
  atsJobs: T[],
  currentIds: string[],
  getId: (job: T) => string
) {
  const jobIdSet = new Set(atsJobs.map((job) => getId(job)));
  const currentIdSet = new Set(currentIds);

  // Any ATS job not in the current set needs to be added
  const added = atsJobs.filter((job) => !currentIdSet.has(getId(job)));

  // Any jobs in the current set but not in the ATS need to be deleted
  const removed = currentIds.filter((id) => !jobIdSet.has(id));

  // If job is in both ATS and DB, do nothing but keep a count
  const existing = jobIdSet.size - added.length;

  return { added, removed, existing };
}
