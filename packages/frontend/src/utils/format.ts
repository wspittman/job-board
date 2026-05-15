/**
 * A utility class for formatting numbers, percentages, dates, and currency values.
 */
class Format {
  #number = new Intl.NumberFormat(undefined, {
    notation: "compact",
    roundingMode: "trunc",
  });
  #percent = new Intl.NumberFormat(undefined, { style: "percent" });
  #dateTime = new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
  #date = new Intl.DateTimeFormat(undefined, { dateStyle: "short" });
  #relativeTime = new Intl.RelativeTimeFormat(undefined, {
    numeric: "auto",
  });
  #currency = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
    notation: "compact",
    roundingMode: "trunc",
  });
  #collator = new Intl.Collator(undefined, { sensitivity: "base" });

  /**
   * Formats a number using compact notation.
   * @param value The number to format. Defaults to 0 if not provided.
   * @returns The formatted number string.
   */
  number(value: number = 0): string {
    return this.#number.format(value);
  }

  /**
   * Formats a value as a percentage of a total.
   * If the total is zero or negative, it returns "0%".
   * If the value is negative, it is treated as zero.
   * @param value The value to format. Defaults to 0 if not provided.
   * @param total The total value. Defaults to 0 if not provided.
   * @returns The formatted percentage string.
   */
  percent(value: number = 0, total: number = 0): string {
    value = Math.max(value, 0);
    total = Math.max(total, 0);
    const pct = total > 0 ? value / total : 0;
    return this.#percent.format(pct);
  }

  /**
   * Formats a timestamp into a full date and time string.
   * @param value The timestamp to format, in milliseconds since the Unix epoch.
   * @returns The formatted date and time string.
   */
  dateTime(value: number): string {
    return this.#dateTime.format(value);
  }

  /**
   * Formats a timestamp into a short date string.
   * @param value The timestamp to format, in milliseconds since the Unix epoch.
   * @returns The formatted date string.
   */
  date(value: number): string {
    return this.#date.format(value);
  }

  /**
   * Formats a timestamp into a relative time string (e.g., "Just Posted", "Past Week", "3 days ago").
   * @param days The number of days ago the timestamp is from the current time.
   * @returns The formatted relative time string.
   */
  daysAgo(days: number): string {
    if (days === 0) return "Just Posted";
    if (days < 7) return "Past Week";
    return this.#relativeTime.format(-days, "day");
  }

  /**
   * Formats a number as a currency value.
   * @param value The number to format.
   * @returns The formatted currency string.
   */
  currency(value: number): string {
    return this.#currency.format(value);
  }

  /**
   * Sorts an array of [value, label] entries into an array of { value, label } objects sorted by label.
   * @param entries The array of [value, label] entries to sort and format.
   * @returns An array of { value, label } objects sorted by label.
   */
  sortedOptions(
    entries: [string, string][],
  ): { value: string; label: string }[] {
    return entries
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => this.#collator.compare(a.label, b.label));
  }
}

export const fmt = new Format();
