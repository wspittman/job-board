import "../sharedStyles/all.css";
import "./explore.css";

type ExploreJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  commitment: string;
  posted: string;
  details: string[];
};

const jobEntries: ExploreJob[] = [
  {
    id: "aurora",
    title: "Product Designer",
    company: "SkyBound Labs",
    location: "Remote (US)",
    commitment: "Full-time · Remote",
    posted: "Posted 3 days ago",
    details: [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vestibulum ligula eget metus viverra, vitae consequat lorem mattis.",
      "Integer id nisi ut quam ullamcorper ullamcorper vitae eget sapien. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
      "Curabitur tristique, libero vitae egestas scelerisque, lectus libero venenatis purus, vel cursus massa enim sit amet lorem.",
    ],
  },
  {
    id: "lumen",
    title: "Staff Frontend Engineer",
    company: "Lumen Analytics",
    location: "Austin, TX",
    commitment: "Full-time · Hybrid",
    posted: "Posted 1 week ago",
    details: [
      "Suspendisse sodales, lacus sit amet tristique sagittis, mauris velit dapibus lorem, id vulputate mauris enim vel arcu.",
      "Mauris pharetra magna vitae lectus vulputate, ut hendrerit velit volutpat. In volutpat, nisl id volutpat accumsan, elit lorem aliquet arcu, ac porta erat ipsum sit amet est.",
      "Aliquam vel lacus bibendum, iaculis justo at, suscipit augue. Sed fermentum ut neque eu volutpat.",
    ],
  },
  {
    id: "harbor",
    title: "Technical Program Manager",
    company: "Harbor Systems",
    location: "New York, NY",
    commitment: "Full-time · Onsite",
    posted: "Posted 2 weeks ago",
    details: [
      "Praesent convallis velit erat, vitae tincidunt nunc gravida eget. Integer egestas orci eu nibh interdum, nec ultrices libero imperdiet.",
      "Vestibulum condimentum nisl nec purus dictum, sed rhoncus orci faucibus. Duis convallis orci ut elit aliquet, id blandit magna vehicula.",
      "Donec vitae porta nisl. Integer suscipit, urna sed faucibus vestibulum, velit eros mattis metus, at interdum dolor sapien vitae nisi.",
    ],
  },
];

const jobMap = new Map(jobEntries.map((job) => [job.id, job] as const));

const filtersElement = document.querySelector<HTMLElement>("[data-filters]");
const filterToggle = document.querySelector<HTMLButtonElement>("[data-filters-toggle]");

filterToggle?.addEventListener("click", () => {
  if (!filtersElement) {
    return;
  }

  const isOpen = filtersElement.dataset["state"] !== "closed";
  const nextState = isOpen ? "closed" : "open";
  filtersElement.dataset["state"] = nextState;
  filterToggle.setAttribute("aria-expanded", String(nextState === "open"));
});

const jobCards = document.querySelectorAll<HTMLButtonElement>("[data-job-card]");
const detailSection = document.querySelector<HTMLElement>("[data-job-detail]");
const detailTitle = detailSection?.querySelector<HTMLElement>("[data-detail-title]");
const detailMeta = detailSection?.querySelector<HTMLElement>("[data-detail-meta]");
const detailBody = detailSection?.querySelector<HTMLElement>("[data-detail-body]");

const updateDetail = (jobId: string) => {
  const job = jobMap.get(jobId);

  if (!job || !detailTitle || !detailMeta || !detailBody) {
    return;
  }

  detailTitle.textContent = `${job.title} at ${job.company}`;
  detailMeta.textContent = `${job.location} · ${job.commitment} · ${job.posted}`;
  detailBody.innerHTML = "";

  job.details.forEach((text) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    detailBody.appendChild(paragraph);
  });
};

const selectCard = (selectedId: string) => {
  jobCards.forEach((card) => {
    const cardId = card.dataset["jobCard"] ?? "";
    const isActive = cardId === selectedId;
    card.classList.toggle("is-selected", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
};

jobCards.forEach((card) => {
  card.addEventListener("click", () => {
    const jobId = card.dataset["jobCard"];

    if (!jobId) {
      return;
    }

    selectCard(jobId);
    updateDetail(jobId);
  });
});

const defaultCard = document.querySelector<HTMLButtonElement>(".job-card.is-selected");
const initialId = defaultCard?.dataset["jobCard"] ?? jobEntries[0]?.id;

if (initialId) {
  selectCard(initialId);
  updateDetail(initialId);
}
