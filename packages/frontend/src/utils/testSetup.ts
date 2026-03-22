import { vi } from "vitest";

Object.defineProperty(global.navigator, "sendBeacon", {
  value: vi.fn(),
  writable: true,
});
