import { ComponentBase } from "./componentBase";
import {
  FormElement,
  type FormElementProps,
  type FormOption,
} from "./form-element";

import css from "./form-combobox.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-combobox";

export class FormCombobox extends FormElement {
  readonly #menu: MenuEl;
  #formValue: string = "";

  constructor() {
    super("input", cssSheet);
    this.intake.setAttribute("autocomplete", "off");
    this.intake.setAttribute("role", "combobox");

    this.#menu = new MenuEl();
    this.getEl("intake-wrap")!.append(this.#menu.element);

    this.addEventListener("focusout", (event) => this.#handleFocusOut(event));
    this.intake.addEventListener("focus", () => this.#menu.open());
    this.intake.addEventListener("keydown", (event) =>
      this.#menu.handleKeydown(event as KeyboardEvent)
    );
  }

  override init({ options = [], ...rest }: FormElementProps) {
    super.init(rest);
    this.#menu.init(options, (option) => this.#selectOption(option));
  }

  override set value(value: unknown) {
    const option = this.#menu.optionFromValue(String(value ?? ""));
    this.#selectOption(option);
  }

  protected override getFormValue() {
    return this.#formValue;
  }

  protected override onInput() {
    this.#formValue = "";
    this.#menu.filter(this.intake.value);
    this.#menu.open();
  }

  #handleFocusOut(event: FocusEvent) {
    const related = event.relatedTarget as Node | null;
    const isInternal =
      related && (this.contains(related) || this.root.contains(related));

    if (isInternal) return;

    this.#menu.close();
  }

  #selectOption(option?: FormOption) {
    if (!option) return;
    this.#formValue = String(option.value ?? "");
    super.value = option.label;
    const input = this.intake as HTMLInputElement;
    input.setSelectionRange(input.value.length, input.value.length);
    input.focus();
    this.#menu.close();
  }
}

class MenuEl {
  readonly element: HTMLUListElement;
  readonly #options: Record<string, OptionEl> = {};
  readonly #emptyOption: OptionEl;

  #filteredOptions: OptionEl[] = [];
  #activeIndex = -1;
  #isOpen = false;
  #onSelect?: (option?: OptionEl) => void;

  constructor() {
    this.element = document.createElement("ul");
    this.element.className = "options";
    this.element.setAttribute("role", "listbox");

    this.element.addEventListener("mousedown", (event) =>
      event.preventDefault()
    );
    this.element.addEventListener("click", (event) => this.#onClick(event));

    this.#emptyOption = new OptionEl({ label: "No options", value: "" });
    this.#emptyOption.element.classList.add("empty");

    this.close();
  }

  init(options: FormOption[], onSelect: (option?: OptionEl) => void) {
    this.#onSelect = onSelect;
    options.forEach((opt) => {
      const optionEl = new OptionEl(opt);
      this.#options[optionEl.value] = optionEl;
    });
    this.#clearFilter();
    this.close();
  }

  filter(query: string) {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      this.#clearFilter();
      return;
    }

    const oldActive = this.#filteredOptions[this.#activeIndex];
    this.#filteredOptions = Object.values(this.#options).filter((x) =>
      x.compareLabel.includes(trimmed)
    );

    if (oldActive) {
      this.#activeIndex = this.#filteredOptions.indexOf(oldActive);
    } else {
      this.#activeIndex = this.#filteredOptions.length ? 0 : -1;
    }

    this.#render();
  }

  handleKeydown(event: KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.open();
        this.#moveActiveIndex(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.open();
        this.#moveActiveIndex(-1);
        break;
      case "Enter":
        if (this.#isOpen && this.#activeIndex >= 0) {
          event.preventDefault();
          const option = this.#filteredOptions[this.#activeIndex];
          if (option) {
            this.#onSelect?.(option);
          }
        }
        break;
      case "Escape":
        if (this.#isOpen) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  open() {
    this.#isOpen = true;
    this.element.hidden = false;
  }

  close() {
    this.#isOpen = false;
    this.element.hidden = true;
  }

  optionFromValue(value: string): FormOption | undefined {
    return this.#options[value];
  }

  #moveActiveIndex(delta: number) {
    const length = this.#filteredOptions.length;

    if (!length) {
      this.#activeIndex = -1;
      return;
    }

    this.#activeIndex = (this.#activeIndex + delta + length) % length;

    this.#filteredOptions.forEach((item, idx) => {
      const isActive = idx === this.#activeIndex;
      item.active = isActive;
      if (isActive) {
        item.element.scrollIntoView({ block: "nearest" });
      }
    });
  }

  #clearFilter() {
    this.#filteredOptions = Object.values(this.#options);
    this.#activeIndex = -1;
    this.#render();
  }

  #render() {
    const options = this.#filteredOptions;

    if (!options.length) {
      this.element.replaceChildren(this.#emptyOption.element);
    } else {
      this.element.replaceChildren(...options.map((x) => x.element));
      this.element.scrollTop = 0;
    }

    this.open();
  }

  #onClick({ target }: PointerEvent) {
    if (!this.#onSelect) return;
    const value = OptionEl.valueFromLI(target as HTMLLIElement);
    this.#onSelect(this.#options[value]);
  }
}

class OptionEl {
  readonly label: string;
  readonly value: string;
  readonly compareLabel: string;
  readonly element: HTMLLIElement;

  constructor({ label, value }: FormOption) {
    this.label = label;
    this.value = String(value ?? "");
    this.compareLabel = label.trim().toLowerCase();

    this.element = document.createElement("li");
    this.element.className = "option";
    this.element.textContent = this.label;
    this.element.dataset["value"] = this.value;
    this.element.setAttribute("role", "option");
  }

  set active(val: boolean) {
    this.element.classList.toggle("active", val);
  }

  static valueFromLI(el: HTMLLIElement): string {
    return el.dataset["value"] ?? "";
  }
}

ComponentBase.register(tag, FormCombobox);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: FormCombobox;
  }
}
