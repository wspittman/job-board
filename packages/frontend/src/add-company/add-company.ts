import "../sharedStyles/all.css";
import "./add-company.css";

import "../components/form-input.ts";
import "../components/form-select.ts";

import { api } from "../api/api.ts";
import type { CompanyKeyApi } from "../api/apiTypes.ts";

const slugPattern = /^[a-zA-Z0-9_-]+$/;
const maxSlugLength = 100;

const atsSelect = document.getElementById("ats-select") as Element & {
  init: (props: object) => void;
};
const slugInput = document.getElementById("slug-input") as Element & {
  init: (props: object) => void;
};
const form = document.getElementById("add-company-form") as HTMLFormElement;
const feedback = document.getElementById("add-company-feedback") as HTMLElement;
const submitBtn = form.querySelector<HTMLButtonElement>(".add-company-submit")!;

atsSelect.init({
  label: "Applicant Tracking System",
  name: "ats",
  options: [
    { label: "Greenhouse", value: "greenhouse" },
    { label: "Lever", value: "lever" },
  ],
});

slugInput.init({
  label: "Company Slug",
  name: "slug",
  maxLength: maxSlugLength,
  tooltip:
    "The company identifier used in your ATS jobs page URL (e.g. boards.greenhouse.io/<slug>).",
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  void onSubmit();
});

async function onSubmit() {
  const ats = (atsSelect.getAttribute("value") ?? "") as
    | "greenhouse"
    | "lever"
    | "";
  const slug = (slugInput.getAttribute("value") ?? "").trim();

  const validationError = validate(slug, ats);
  if (validationError) {
    showFeedback(validationError, "error");
    return;
  }

  const key: CompanyKeyApi = { id: slug, ats };

  submitBtn.disabled = true;
  hideFeedback();

  try {
    await api.addCompany(key);
    showFeedback(
      "Company added! Your jobs should appear within 24 hours.",
      "success",
    );
    submitBtn.disabled = false;
  } catch (err) {
    const status = (err as { status?: number }).status;
    submitBtn.disabled = false;

    if (status === 409) {
      showFeedback(
        'Your company is already indexed. <a href="/jobs">Search for your jobs →</a>',
        "error",
        true,
      );
    } else if (status === 404) {
      showFeedback(
        `We couldn't find that company on ${ats}. Double-check your slug and try again.`,
        "error",
      );
    } else if (status === 400) {
      showFeedback(
        "That doesn't look like a valid company ID. It should match the slug in your ATS URL.",
        "error",
      );
    } else {
      showFeedback(
        'Something went wrong on our end. Try again, or <a href="mailto:contact@betterjobboard.net">email us</a>.',
        "error",
        true,
      );
    }
  }
}

/**
 * Validates the slug and ATS selection before submitting.
 * @param slug - The company slug from the input.
 * @param ats - The selected ATS value.
 * @returns An error message string, or null if valid.
 */
function validate(slug: string, ats: string): string | null {
  if (!ats) {
    return "Please select an applicant tracking system.";
  }
  if (!slug) {
    return "Please enter your company slug.";
  }
  if (!slugPattern.test(slug)) {
    return "That doesn't look like a valid company ID. It should match the slug in your ATS URL.";
  }
  if (slug.length > maxSlugLength) {
    return `Slug must be ${maxSlugLength} characters or fewer.`;
  }
  return null;
}

function showFeedback(
  message: string,
  type: "error" | "success",
  html = false,
) {
  feedback.classList.toggle("feedback-error", type === "error");
  feedback.classList.toggle("feedback-success", type === "success");
  if (html) {
    feedback.innerHTML = message;
  } else {
    feedback.textContent = message;
  }
  feedback.removeAttribute("hidden");
}

function hideFeedback() {
  feedback.setAttribute("hidden", "");
  feedback.textContent = "";
  feedback.className = "add-company-feedback";
}
