import { ComponentBase } from "../components/componentBase";

export { spies } from "./testSetup";

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
