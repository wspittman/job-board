import { ComponentBase } from "./componentBase";
import {
  FormElement,
  type FormElementProps,
  type FormOption,
} from "./form-element";

import css from "./form-combobox.css?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "jb-form-combobox";

/**
 * Custom element that combines text input filtering with selectable options.
 * Provides an accessible combobox experience backed by {@link FormElement} features.
 */
export class FormCombobox extends FormElement {
  readonly #menu: MenuEl;
  #formValue: string = "";

  /**
   * Initializes the combobox with menu behavior and keyboard interactions.
   */
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

  /**
   * Configures the combobox options and shared form state.
   * @param props - Incoming configuration for the combobox element
   */
  override init({ options = [], ...rest }: FormElementProps) {
    super.init(rest);
    this.#menu.init(options, (option) => this.#selectOption(option));
  }

  /**
   * Selects an option based on the provided value.
   * @param value - The form value to search for among options
   */
  override set value(value: unknown) {
    const option = this.#menu.optionFromValue(String(value ?? ""));
    this.#selectOption(option);
  }

  /**
   * Retrieves the value that should be submitted with the parent form.
   */
  protected override getFormValue() {
    return this.#formValue;
  }

  /**
   * Handles user input by filtering options and reopening the menu.
   */
  protected override onInput() {
    this.#formValue = "";
    this.intake.classList.toggle("has-value", !!this.intake.value);
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

/**
 * Helper class that manages the combobox options list and interactions.
 */
class MenuEl {
  readonly element: HTMLUListElement;
  readonly #options: Record<string, OptionEl> = {};
  readonly #emptyOption: OptionEl;

  #filteredOptions: OptionEl[] = [];
  #activeIndex = -1;
  #isOpen = false;
  #onSelect?: (option?: OptionEl) => void;

  /**
   * Creates the DOM structure and sets up event listeners for the menu list.
   */
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

  /**
   * Prepares menu options and assigns the selection callback.
   * @param options - List of selectable form options
   * @param onSelect - Handler triggered when an option is chosen
   */
  init(options: FormOption[], onSelect: (option?: OptionEl) => void) {
    this.#onSelect = onSelect;
    options
      .sort((a, b) => a.label.localeCompare(b.label))
      .forEach((opt) => {
        const optionEl = new OptionEl(opt);
        this.#options[optionEl.value] = optionEl;
      });
    this.#clearFilter();
    this.close();
  }

  /**
   * Filters visible options based on the supplied query string.
   * @param query - The user-entered text to match against option labels
   */
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

  /**
   * Handles keyboard navigation and selection within the menu.
   * @param event - The keyboard event emitted from the input element
   */
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

  /**
   * Makes the option list visible.
   */
  open() {
    this.#isOpen = true;
    this.element.hidden = false;
  }

  /**
   * Hides the option list.
   */
  close() {
    this.#isOpen = false;
    this.element.hidden = true;
  }

  /**
   * Retrieves an option by its form value.
   * @param value - The form value associated with the option
   */
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

/**
 * Wrapper for individual menu options that tracks metadata and DOM state.
 */
class OptionEl {
  readonly label: string;
  readonly value: string;
  readonly compareLabel: string;
  readonly element: HTMLLIElement;

  /**
   * Creates a list item representing a selectable option.
   * @param option - Source option metadata from the combobox props
   */
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

  /**
   * Toggles the visual active state of the option.
   * @param val - Whether the option should be marked as active
   */
  set active(val: boolean) {
    this.element.classList.toggle("active", val);
  }

  /**
   * Reads the stored value identifier from a list element.
   * @param el - The list element representing an option
   */
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
