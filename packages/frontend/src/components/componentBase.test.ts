import { expect, suite, test, vi } from "vitest";
import { ComponentBase } from "./componentBase";

class TestComponent extends ComponentBase {
  readonly onLoadSpy = vi.fn(() => Promise.resolve());

  constructor(options?: { omitPartsCss?: boolean }) {
    super(
      '<div id="title"></div><div id="subtitle"></div>',
      ComponentBase.createCSSSheet(":host { display: block; }"),
      options,
    );
  }

  protected override onLoad(): Promise<void> {
    return this.onLoadSpy();
  }

  setTextValue(id: string, value?: string) {
    this.setText(id, value);
  }

  setManyTextValues(values: Record<string, string | undefined>) {
    this.setManyTexts(values);
  }

  getElement<T extends HTMLElement>(id: string): T | null {
    return this.getEl<T>(id);
  }

  emitEvent(type: string, detail?: unknown) {
    this.emit(type, detail);
  }

  listenFor<T>(type: string, fn: (detail: T) => void) {
    this.listen(type, fn);
  }
}

let componentCounter = 0;

function createComponentClass(options?: { omitPartsCss?: boolean }) {
  return class ConfiguredTestComponent extends TestComponent {
    constructor() {
      super(options);
    }
  };
}

function createRegisteredComponent(options?: {
  omitPartsCss?: boolean;
}): TestComponent {
  const tag = `component-base-test-${componentCounter++}`;
  const ComponentClass = createComponentClass(options);

  ComponentBase.register(tag, ComponentClass);

  return document.createElement(tag) as TestComponent;
}

suite("ComponentBase", () => {
  test.each([
    { omitPartsCss: false, expectedSheets: 3 },
    { omitPartsCss: true, expectedSheets: 2 },
  ])(
    "creates a shadow root with the expected adopted stylesheets when omitPartsCss=$omitPartsCss",
    ({ omitPartsCss, expectedSheets }) => {
      const component = createRegisteredComponent({ omitPartsCss });

      expect(component.shadowRoot).not.toBeNull();
      expect(component.shadowRoot?.innerHTML).toContain(
        '<div id="title"></div>',
      );
      expect(component.shadowRoot?.adoptedStyleSheets).toHaveLength(
        expectedSheets,
      );
    },
  );

  test("sets and gets elements inside the shadow root", () => {
    const component = createRegisteredComponent();

    component.setTextValue("title", "Senior Engineer");
    component.setManyTextValues({
      subtitle: undefined,
      missing: "ignored",
    });

    expect(component.getElement<HTMLDivElement>("title")?.textContent).toBe(
      "Senior Engineer",
    );
    expect(component.getElement<HTMLDivElement>("subtitle")?.textContent).toBe(
      "",
    );
    expect(component.getElement("missing")).toBeNull();
  });

  test("dispatches listened custom events with detail payloads", () => {
    const component = createRegisteredComponent();
    const detailSpy = vi.fn<(detail: { jobId: string }) => void>();
    const bubbleSpy = vi.fn();

    component.listenFor<{ jobId: string }>("saved", detailSpy);
    document.body.addEventListener("saved", bubbleSpy);
    document.body.appendChild(component);

    component.emitEvent("saved", { jobId: "job-123" });

    expect(detailSpy).toHaveBeenCalledWith({ jobId: "job-123" });
    expect(bubbleSpy).toHaveBeenCalledTimes(1);
  });

  test("calls onLoad when connected to the DOM", async () => {
    const component = createRegisteredComponent();

    document.body.appendChild(component);
    await Promise.resolve();

    expect(component.onLoadSpy).toHaveBeenCalledTimes(1);
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
