export interface SelectorOption {
  value: string;
  text: string;
}

export interface ComponentProps<T> {
  label: string;
  value: T;
  setValue: (value: T) => void;
  isDisabled?: boolean;
  tooltip?: string;
}
