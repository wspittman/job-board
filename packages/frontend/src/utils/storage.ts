type Storage = "local" | "session";
type Target = "headers" | "query";

const idKeys = ["visitorId", "sessionId"] as const;
const idHeaders = ["Jb-Visitor-Id", "Jb-Session-Id"] as const;

export function getStorageIds(target: Target): Record<string, string> {
  const [visitorKey, sessionKey] = target === "headers" ? idHeaders : idKeys;
  const visitorId = getId("local", idKeys[0]);
  const sessionId = getId("session", idKeys[1]);

  const result: Record<string, string> = {};

  if (visitorId) {
    result[visitorKey] = visitorId;
  }

  if (sessionId) {
    result[sessionKey] = sessionId;
  }

  return result;
}

function getId(sType: Storage, key: string): string | undefined {
  try {
    const storage =
      sType === "local" ? window.localStorage : window.sessionStorage;
    let id = storage.getItem(key) ?? undefined;

    if (!id) {
      id = window.crypto.randomUUID();
      storage.setItem(key, id);
    }

    return id;
  } catch {
    return undefined;
  }
}
