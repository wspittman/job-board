import { beforeEach, vi } from "vitest";

export const spies = {
  sendBeacon: vi.fn(),
  setFormValue: vi.fn(),
  fetchMetadata: vi.fn(),
};

Object.defineProperty(global.navigator, "sendBeacon", {
  value: spies.sendBeacon,
});

Object.defineProperty(HTMLElement.prototype, "attachInternals", {
  value: vi.fn(() => ({ setFormValue: spies.setFormValue })),
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  value: vi.fn(),
});

vi.mock("../api/api", () => ({ api: { fetchMetadata: spies.fetchMetadata } }));

beforeEach(vi.clearAllMocks);
