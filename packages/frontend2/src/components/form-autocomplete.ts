import { ComponentBase } from "./componentBase";
import { FormElement, type FormElementProps } from "./form-element";
import css from "./form-autocomplete.css?raw";

const cssSheet = ComponentBase.createCSSSheet(css);

interface OptionDefinition {
  label: string;
  value: unknown;
}

export interface FormAutocompleteProps extends FormElementProps {
  options: OptionDefinition[];
}

export class FormAutocomplete extends FormElement {
  #options: OptionDefinition[] = [];
  #filteredOptions: OptionDefinition[] = [];
  #menu: HTMLUListElement;
  #isOpen = false;
  #activeIndex = -1;
  #ignoreBlur = false;
  #selectedOption?: OptionDefinition;

  constructor() {
    super("input", cssSheet);
    this.intake.setAttribute("type", "text");
    this.intake.setAttribute("placeholder", " ");
    this.intake.setAttribute("autocomplete", "off");
    this.intake.setAttribute("role", "combobox");
    this.intake.setAttribute("aria-autocomplete", "list");
    this.intake.setAttribute("aria-expanded", "false");
    this.intake.setAttribute("aria-controls", "options");

    this.#menu = document.createElement("ul");
    this.#menu.className = "options";
    this.#menu.id = "options";
    this.#menu.hidden = true;
    this.#menu.setAttribute("role", "listbox");
    this.getEl("intake-wrap")!.append(this.#menu);

    this.intake.addEventListener("input", this.#handleInput, {
      capture: true,
    });
    this.intake.addEventListener("focus", () => this.#open());
    this.intake.addEventListener("keydown", (event) =>
      this.#handleKeydown(event as KeyboardEvent)
    );
    this.addEventListener("focusout", (event) => this.#handleFocusOut(event));
  }

  override init({ options, value, ...rest }: FormAutocompleteProps) {
    this.#setOptions(options);
    super.init({ ...rest, value });
    this.#filterOptions(this.intake.value);
  }

  override set value(value: unknown) {
    if (value === undefined || value === null || value === "") {
      this.#selectedOption = undefined;
      this.#activeIndex = -1;
      super.value = "";
      this.#filterOptions("");
      return;
    }

    const valueString = String(value);
    const option = this.#options.find(
      ({ value: optionValue }) => String(optionValue ?? "") === valueString
    );

    if (option) {
      this.#selectedOption = option;
      super.value = option.label;
    } else {
      this.#selectedOption = undefined;
      super.value = valueString;
    }

    this.#filterOptions(this.intake.value);
  }

  protected override computeFormValue(displayValue: string) {
    if (this.#selectedOption) {
      return String(this.#selectedOption.value ?? "");
    }

    return displayValue;
  }

  #setOptions(options: OptionDefinition[]) {
    this.#options = options;
    this.#filteredOptions = options;
    this.#renderOptions();
  }

  #handleInput = () => {
    this.#selectedOption = undefined;
    this.#filterOptions(this.intake.value);
    this.#open();
  };

  #handleKeydown(event: KeyboardEvent) {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#open();
        this.#moveActiveIndex(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        this.#open();
        this.#moveActiveIndex(-1);
        break;
      case "Enter":
        if (this.#isOpen && this.#activeIndex >= 0) {
          event.preventDefault();
          const option = this.#filteredOptions[this.#activeIndex];
          if (option) {
            this.#selectOption(option);
          }
        }
        break;
      case "Escape":
        if (this.#isOpen) {
          event.preventDefault();
          this.#close();
        }
        break;
      default:
    }
  }

  #handleFocusOut(event: FocusEvent) {
    const related = event.relatedTarget as Node | null;
    if (this.#ignoreBlur) {
      this.#ignoreBlur = false;
      this.intake.focus();
      return;
    }

    if (!related) {
      this.#close();
      return;
    }

    if (this.contains(related) || this.root.contains(related)) {
      return;
    }

    this.#close();
  }

  #filterOptions(query: string) {
    const trimmed = query.trim().toLowerCase();
    this.#filteredOptions = this.#options.filter(({ label }) => {
      if (!trimmed) return true;
      return label.toLowerCase().includes(trimmed);
    });
    if (this.#selectedOption) {
      const index = this.#filteredOptions.indexOf(this.#selectedOption);
      this.#activeIndex = index >= 0 ? index : -1;
    } else {
      this.#activeIndex = this.#filteredOptions.length ? 0 : -1;
    }
    this.#renderOptions();
    if (!this.#filteredOptions.length) {
      this.#close();
    }
  }

  #renderOptions() {
    const options = this.#filteredOptions.map((option, index) => {
      const item = document.createElement("li");
      item.className = "option";
      item.textContent = option.label;
      item.dataset["value"] = String(option.value ?? "");
      item.setAttribute("role", "option");
      if (index === this.#activeIndex) item.classList.add("active");
      item.addEventListener("mousedown", (event) => {
        event.preventDefault();
        this.#ignoreBlur = true;
      });
      item.addEventListener("click", () => this.#selectOption(option));
      return item;
    });

    this.#menu.replaceChildren(...options);
    this.#menu.hidden = !options.length;
    if (!this.#menu.hidden) {
      this.#menu.scrollTop = 0;
    }

    if (this.#isOpen) {
      this.#open();
    }
  }

  #moveActiveIndex(delta: number) {
    const { length } = this.#filteredOptions;
    if (!length) {
      this.#activeIndex = -1;
      return;
    }

    this.#activeIndex = (this.#activeIndex + delta + length) % length;
    const items = Array.from(this.#menu.querySelectorAll<HTMLLIElement>(
      ".option"
    ));

    for (const [index, item] of items.entries()) {
      item.classList.toggle("active", index === this.#activeIndex);
      if (index === this.#activeIndex) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }

  #selectOption(option: OptionDefinition) {
    this.#selectedOption = option;
    super.value = option.label;
    this.#close();
    const input = this.intake as HTMLInputElement;
    input.setSelectionRange?.(input.value.length, input.value.length);
    input.focus();
  }

  #open() {
    if (!this.#filteredOptions.length) {
      this.#close();
      return;
    }

    this.#isOpen = true;
    this.#menu.hidden = false;
    this.intake.setAttribute("aria-expanded", "true");
  }

  #close() {
    this.#isOpen = false;
    this.#menu.hidden = true;
    this.intake.setAttribute("aria-expanded", "false");
  }
}

ComponentBase.register("jb-form-autocomplete", FormAutocomplete);

declare global {
  interface HTMLElementTagNameMap {
    "jb-form-autocomplete": FormAutocomplete;
  }
}
