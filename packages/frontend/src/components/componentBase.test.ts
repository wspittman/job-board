import { expect, suite, test, vi } from "vitest";
import { createComponent, type XrayComponent } from "../utils/testUtils";
import { ComponentBase } from "./componentBase";

type Options = ConstructorParameters<typeof ComponentBase>[2];

class TestComponent extends ComponentBase {
  constructor(options?: Options) {
    super(
      '<div id="title"></div><div id="subtitle"></div>',
      ComponentBase.createCSSSheet(":host { display: block; }"),
      options,
    );
  }
}

class OwnContainerComponent extends ComponentBase {
  constructor() {
    super(
      '<section id="shell" class="card"><div id="title"></div></section>',
      ComponentBase.createCSSSheet(":host { display: block; }"),
      { byoc: true },
    );
  }
}

const create = (params?: Options) =>
  createComponent(TestComponent, params) as XrayComponent;

suite("ComponentBase", () => {
  test("creates a shadow root with the expected adopted stylesheets", () => {
    const omitEl = create({ omitPartsCss: true });
    const allowEl = create({ omitPartsCss: false });

    expect(omitEl.shadowRoot).not.toBeNull();
    expect(allowEl.shadowRoot).not.toBeNull();
    expect(omitEl.shadowRoot?.innerHTML).toContain('<div id="title"></div>');
    expect(allowEl.shadowRoot?.innerHTML).toContain('<div id="title"></div>');
    expect(omitEl.shadowRoot?.adoptedStyleSheets).toHaveLength(2);
    expect(allowEl.shadowRoot?.adoptedStyleSheets).toHaveLength(3);
  });

  test("wraps component html in a container by default", () => {
    const component = create();

    expect(component.container.tagName).toBe("DIV");
    expect(component.container.className).toBe("container");
    expect(component.shadowRoot.firstElementChild).toBe(component.container);
    expect(component.container.querySelector("#title")).not.toBeNull();
    expect(component.container.querySelector("#subtitle")).not.toBeNull();
  });

  test("uses the provided container when byoc is enabled", () => {
    const component = createComponent(OwnContainerComponent) as XrayComponent;

    expect(component.container.tagName).toBe("SECTION");
    expect(component.container.id).toBe("shell");
    expect(component.container.classList.contains("card")).toBe(true);
    expect(component.container.classList.contains("container")).toBe(true);
    expect(component.shadowRoot.firstElementChild).toBe(component.container);
  });

  test("sets and gets elements inside the shadow root", () => {
    const component = create();
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
    const component = create();
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
    const component = create();
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
