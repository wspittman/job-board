import { expect, suite, test, vi } from "vitest";
import { createComponent } from "../utils/testUtils";
import { ComponentBase } from "./componentBase";

class TestComponent extends ComponentBase {
  constructor(options?: { omitPartsCss?: boolean }) {
    super(
      '<div id="title"></div><div id="subtitle"></div>',
      ComponentBase.createCSSSheet(":host { display: block; }"),
      options,
    );
  }
}

// Type for accessing protected members of ComponentBase in tests
type Testable = TestComponent & {
  onLoad: ComponentBase["onLoad"];
  setText: ComponentBase["setText"];
  setManyTexts: ComponentBase["setManyTexts"];
  getEl: ComponentBase["getEl"];
  emit: ComponentBase["emit"];
  listen: ComponentBase["listen"];
};

suite("ComponentBase", () => {
  test("creates a shadow root with the expected adopted stylesheets", () => {
    const omit = { omitPartsCss: true };
    const allow = { omitPartsCss: false };
    const omitEl = createComponent(TestComponent, omit) as Testable;
    const allowEl = createComponent(TestComponent, allow) as Testable;

    expect(omitEl.shadowRoot).not.toBeNull();
    expect(allowEl.shadowRoot).not.toBeNull();
    expect(omitEl.shadowRoot?.innerHTML).toContain('<div id="title"></div>');
    expect(allowEl.shadowRoot?.innerHTML).toContain('<div id="title"></div>');
    expect(omitEl.shadowRoot?.adoptedStyleSheets).toHaveLength(2);
    expect(allowEl.shadowRoot?.adoptedStyleSheets).toHaveLength(3);
  });

  test("sets and gets elements inside the shadow root", () => {
    const component = createComponent(TestComponent) as Testable;

    component.setText("title", "Senior Engineer");
    component.setManyTexts({
      subtitle: undefined,
      missing: "ignored",
    });

    expect(component.getEl("title")?.textContent).toBe("Senior Engineer");
    expect(component.getEl("subtitle")?.textContent).toBe("");
    expect(component.getEl("missing")).toBeNull();
  });

  test("dispatches listened custom events with detail payloads", () => {
    const component = createComponent(TestComponent) as Testable;
    const detailSpy = vi.fn();
    const bubbleSpy = vi.fn();

    component.listen("saved", detailSpy);
    document.body.addEventListener("saved", bubbleSpy);
    document.body.appendChild(component);

    component.emit("saved", { jobId: "job-123" });

    expect(detailSpy).toHaveBeenCalledWith({ jobId: "job-123" });
    expect(bubbleSpy).toHaveBeenCalledTimes(1);
  });

  test("calls onLoad when connected to the DOM", async () => {
    const component = createComponent(TestComponent) as Testable;
    const onLoadSpy = vi.spyOn(component, "onLoad");

    document.body.appendChild(component);
    await Promise.resolve();

    expect(onLoadSpy).toHaveBeenCalledTimes(1);
  });

  test("register defines a custom element only once", () => {
    const tag = `component-base-registered-${crypto.randomUUID()}`;
    class RegisteredComponent extends HTMLElement {}
    const redefine = vi.fn();

    ComponentBase.register(tag, RegisteredComponent);
    const originalDefine = customElements.define.bind(customElements);
    customElements.define = redefine as typeof customElements.define;

    try {
      ComponentBase.register(tag, class extends HTMLElement {});
    } finally {
      customElements.define = originalDefine;
    }

    expect(customElements.get(tag)).toBe(RegisteredComponent);
    expect(redefine).not.toHaveBeenCalled();
  });

  test("creates constructed stylesheets from css strings", () => {
    const sheet = ComponentBase.createCSSSheet(":host { color: red; }");

    expect(sheet.cssRules).toHaveLength(1);
    expect(sheet.cssRules[0]?.cssText).toContain("color: red");
  });
});
