import { beforeEach, vi } from "vitest";

export const spies = {
  sendBeacon: vi.fn(),
  setFormValue: vi.fn(),
};

export const mockApi = {
  fetchMetadata: vi.fn(),
  fetchJobs: vi.fn(),
  interpretQuery: vi.fn(),
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

vi.mock("../api/api", () => ({ api: mockApi }));

beforeEach(vi.clearAllMocks);
