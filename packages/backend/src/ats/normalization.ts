const ACRONYM_LEN = 3;

/**
 * Normalizes ATS-provided job titles
 * @param title Raw job title string from the API.
 * @returns A normalized title suitable for storage and display.
 */
export function normTitle(input: string): string {
  const title = input?.trim() ?? "";

  // Leave short titles and those with lowercase letters unchanged
  if (title.length <= ACRONYM_LEN) return title;
  if (/[a-z]/.test(title)) return title;

  // Split into alternating runs of [A-Z]+ and everything else
  const parts = title.match(/[A-Z]+|[^A-Z]+/g) ?? [];

  return parts
    .map((p) => {
      if (p.length <= ACRONYM_LEN || /^[^A-Z]+$/.test(p)) return p;

      return p[0] + p.slice(1).toLowerCase();
    })
    .join("");
}
