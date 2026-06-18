/**
 * Useful if you have an arbitrary string that needs to become a cosmosDB id
 */
export function normalizeId(key: string) {
  return (
    key
      .toLowerCase()
      .trim()
      // ['/', '\\', '#', '?'] cannot be used in CosmosDB keys
      .replace(/[/\\#?]/g, "_")
  );
}
