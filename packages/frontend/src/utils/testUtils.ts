import type { MetadataModelApi } from "../api/apiTypes";
import { ComponentBase } from "../components/componentBase";
import type { FormElement } from "../components/form-element";
import { spies } from "./testSetup";

export { spies };

// #region Types for accessing protected component members

export type XrayComponent<T extends ComponentBase = ComponentBase> = T & {
  shadowRoot: ShadowRoot;
  onLoad: ComponentBase["onLoad"];
  setText: ComponentBase["setText"];
  setManyTexts: ComponentBase["setManyTexts"];
  getEl: ComponentBase["getEl"];
  emit: ComponentBase["emit"];
  listen: ComponentBase["listen"];
};

export type XrayFormElement<T extends FormElement = FormElement> =
  XrayComponent<T> & {
    intake: FormElement["intake"];
    getFormValue: FormElement["getFormValue"];
  };

// #endregion

// #region Components

// Special class mixin rules requires any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Class = new (...args: any[]) => ComponentBase;

function withEmptyConstructor<T extends Class>(
  Base: T,
  ...boundArgs: ConstructorParameters<T>
) {
  const MixinSafe = class extends Base {
    // Special class mixin rules requires any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      // Special class mixin rules requires any
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
    }
  };

  return class extends MixinSafe {
    constructor() {
      super(...boundArgs);
    }
  };
}

let componentCounter = 0;

/**
 * Creates a new instance of a ComponentBase-derived class and registers it as a custom element.
 * Use when your component uses a constructor with required arguments that need to be passed in at instantiation time.
 * For simpler cases, you can directly create an instance of the component class.
 * @param Base The class to instantiate.
 * @param args Arguments to pass to the constructor of the class.
 * @returns An instance of the created component.
 */
export function createComponent<T extends Class>(
  Base: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  const tag = `component-test-${componentCounter++}`;
  const ComponentClass = withEmptyConstructor(Base, ...args);

  ComponentBase.register(tag, ComponentClass);

  return document.createElement(tag) as InstanceType<T>;
}

// #endregion

// #region API

/**
 * Mocks the API response for metadata with default values, allowing overrides for specific fields.
 * @param overrides Partial metadata fields to override the default values.
 */
export function mockMetadata(overrides: Partial<MetadataModelApi> = {}) {
  spies.fetchMetadata.mockResolvedValueOnce({
    timestamp: 1777934360621,
    companyCount: 3,
    companyNames: ["test", "example", "abc"].map((name) => [
      name,
      name[0]!.toUpperCase() + name.slice(1),
    ]),
    jobCount: 100,
    recentJobCount: 10,
    presenceCounts: { remote: 40, onsite: 35, hybrid: 25 },
    jobFamilyCounts: { engineering: 60, data: 25, design: 15, marketing: 10 },
    ...overrides,
  });
}

// #endregion
