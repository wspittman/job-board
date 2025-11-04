import { ComponentBase } from "../../components/componentBase.ts";

import css from "./message-card.css?raw";
import html from "./message-card.html?raw";
const cssSheet = ComponentBase.createCSSSheet(css);
const tag = "explore-message-card";

type Message =
  | "AddFilters"
  | "NoMatches"
  | "PartialMatches"
  | "AllMatches"
  | "Error";

interface Props {
  message?: Message;
  count?: number;
}

const messageContent: Record<Message, [string, string, string]> = {
  AddFilters: [
    "Add Filters To Begin",
    "Try to have fun with it!",
    "As you apply filters, jobs will begin appearing here. We'll return the first 24 matches we find for your filter set. You can always adjust your filters until you have a great set of matches.",
  ],
  NoMatches: [
    "No Matches Found",
    "Try adjusting your filters.",
    "You may need to loosen your filters to find matches. Or maybe we don't have good jobs posted for you yet. =(",
  ],
  PartialMatches: [
    "24 Matches Shown",
    "More are available!",
    "By adjusting your filters you can narrow down the results until you have only the best matches for you.",
  ],
  AllMatches: [
    "All Matches Shown",
    "Are these great matches?",
    "If these are great matches, bookmark this page to rerun the search later. New jobs are being posted every day! If the matches aren't quite right, try adjusting your filters until they are.",
  ],
  Error: [
    "⚠️ Well that's not better!",
    "",
    "Unable to load job data. Please try again later.",
  ],
};

function countToMessage(count: number = -1): Message {
  switch (count) {
    case -1:
      return "AddFilters";
    case 0:
      return "NoMatches";
    case 24:
      return "PartialMatches";
    default:
      return "AllMatches";
  }
}

export class MessageCard extends ComponentBase {
  constructor() {
    super(html, cssSheet);
  }

  static create({ message, count }: Props) {
    if (!message) {
      message = countToMessage(count);
    }

    const [title, subtitle, msg] = messageContent[message];
    const element = document.createElement(tag);
    element.setManyTexts({
      title,
      subtitle,
      message: msg,
    });

    if (message === "Error") {
      element.getEl("container")!.classList.add("error-card");
      element.setAttribute("role", "alert");
    }

    return element;
  }
}

ComponentBase.register(tag, MessageCard);

declare global {
  interface HTMLElementTagNameMap {
    [tag]: MessageCard;
  }
}
