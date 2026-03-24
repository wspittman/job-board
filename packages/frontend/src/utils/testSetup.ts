import { vi } from "vitest";

export const spies = {
  sendBeacon: vi.fn(),
  setFormValue: vi.fn(),
};

Object.defineProperty(global.navigator, "sendBeacon", {
  value: spies.sendBeacon,
});

Object.defineProperty(HTMLElement.prototype, "attachInternals", {
  value: vi.fn(() => ({ setFormValue: spies.setFormValue })),
});
