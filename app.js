const form = document.querySelector("#report-form");
const reportOptions = document.querySelectorAll("[data-report-type]");
const formHint = document.querySelector("#form-hint");
const submitLabel = document.querySelector("#submit-label");
const feedback = document.querySelector("#form-feedback");
const description = document.querySelector("#description");
const descriptionCount = document.querySelector("#description-count");
const dateInput = document.querySelector("#date");
const matchResults = document.querySelector("#match-results");
const matchSummary = document.querySelector("#match-summary");
const matchList = document.querySelector("#match-list");
const fields = [...form.querySelectorAll("input, select, textarea")];
const reportStorageKey = "foundly-reports";
const minimumMatchScore = 0.3;

let reportType = "lost";

const today = new Date();
dateInput.max = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

function getErrorMessage(field) {
  const label = form.querySelector(`label[for="${field.id}"]`).textContent.replace("*", "").trim();

  if (field.validity.valueMissing) {
    return `Please enter ${label.toLowerCase()}.`;
  }
  if (field.validity.tooShort) {
    const minimum = field.getAttribute("minlength");
    return `${label} must be at least ${minimum} characters.`;
  }
  if (field.validity.tooLong) {
    const maximum = field.getAttribute("maxlength");
    return `${label} must be ${maximum} characters or fewer.`;
  }
  if (field.validity.rangeOverflow) {
    return "Choose today or an earlier date.";
  }
  return `Please check ${label.toLowerCase()}.`;
}

function updateFieldError(field, showError) {
  const container = field.closest(".field");
  const error = document.querySelector(`#${field.id}-error`);
  const invalid = showError && !field.validity.valid;

  container.classList.toggle("has-error", invalid);
  field.setAttribute("aria-invalid", String(invalid));
  error.textContent = invalid ? getErrorMessage(field) : "";
  return !invalid;
}

function validateField(field) {
  return updateFieldError(field, true);
}

function clearMatchResults() {
  matchResults.hidden = true;
  matchSummary.textContent = "";
  matchList.replaceChildren();
}

function isStoredReport(report) {
  return report
    && typeof report.id === "string"
    && (report.type === "lost" || report.type === "found")
    && typeof report.itemName === "string"
    && typeof report.category === "string"
    && typeof report.color === "string"
    && typeof report.description === "string"
    && typeof report.location === "string"
    && typeof report.date === "string"
    && typeof report.createdAt === "string";
}

function loadSavedReports() {
  let storedReports;

  try {
    storedReports = localStorage.getItem(reportStorageKey);
  } catch (error) {
    console.error("Could not read saved Foundly reports.", error);
    throw new Error("Saved reports could not be read in this browser. Your report was not saved.");
  }

  if (storedReports === null) {
    return [];
  }

  let reports;
  try {
    reports = JSON.parse(storedReports);
  } catch (error) {
    console.error("Saved Foundly reports contain invalid JSON.", error);
    throw new Error("Saved reports could not be read in this browser. Your report was not saved.");
  }

  if (!Array.isArray(reports) || !reports.every(isStoredReport)) {
    console.error("Saved Foundly reports have an unexpected format.");
    throw new Error("Saved reports could not be read in this browser. Your report was not saved.");
  }

  return reports;
}

function saveReports(reports) {
  try {
    localStorage.setItem(reportStorageKey, JSON.stringify(reports));
  } catch (error) {
    console.error("Could not save Foundly reports.", error);
    throw new Error("Your report could not be saved in this browser. Please try again.");
  }
}

function normalizeText(value) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function textSimilarity(first, second) {
  const firstWords = new Set(normalizeText(first).split(/\s+/).filter(Boolean));
  const secondWords = new Set(normalizeText(second).split(/\s+/).filter(Boolean));

  if (firstWords.size === 0 || secondWords.size === 0) {
    return 0;
  }

  let sharedWords = 0;
  firstWords.forEach((word) => {
    if (secondWords.has(word)) {
      sharedWords += 1;
    }
  });

  return (2 * sharedWords) / (firstWords.size + secondWords.size);
}

function getMatchScore(report, candidate) {
  const nameSimilarity = textSimilarity(report.itemName, candidate.itemName);
  const categorySimilarity = textSimilarity(report.category, candidate.category);
  const colorSimilarity = textSimilarity(report.color, candidate.color);
  const descriptionSimilarity = textSimilarity(report.description, candidate.description);
  const score = (
    nameSimilarity * 0.35
    + categorySimilarity * 0.2
    + colorSimilarity * 0.2
    + descriptionSimilarity * 0.25
  );
  const hasItemDetailSignal = nameSimilarity >= 0.25
    || colorSimilarity >= 0.25
    || descriptionSimilarity >= 0.15;

  return hasItemDetailSignal && score >= minimumMatchScore ? score : 0;
}

function findPotentialMatches(report, reports) {
  return reports
    .filter((candidate) => candidate.type !== report.type)
    .map((candidate) => ({ report: candidate, score: getMatchScore(report, candidate) }))
    .filter((match) => match.score > 0)
    .sort((first, second) => (
      second.score - first.score
      || second.report.createdAt.localeCompare(first.report.createdAt)
    ));
}

function appendMatchDetail(card, className, text) {
  const detail = document.createElement("p");
  detail.className = className;
  detail.textContent = text;
  card.append(detail);
}

function createMatchCard(match) {
  const { report } = match;
  const item = document.createElement("li");
  item.className = "match-item";

  const card = document.createElement("article");
  card.className = "match-card";

  const heading = document.createElement("div");
  heading.className = "match-card-heading";

  const name = document.createElement("h3");
  name.textContent = report.itemName;
  heading.append(name);

  const score = document.createElement("span");
  score.className = "match-score";
  score.textContent = `${Math.round(match.score * 100)}% match`;
  heading.append(score);
  card.append(heading);

  const reportLabel = report.type === "lost" ? "Reported lost" : "Reported found";
  appendMatchDetail(
    card,
    "match-meta",
    `${reportLabel} · ${report.category} · ${report.color}`,
  );
  appendMatchDetail(card, "match-description", report.description);
  appendMatchDetail(card, "match-location", `${report.location} · ${report.date}`);

  item.append(card);
  return item;
}

function renderMatchResults(matches) {
  matchList.replaceChildren(...matches.map(createMatchCard));
  matchSummary.textContent = matches.length
    ? `We found ${matches.length} potential ${matches.length === 1 ? "match" : "matches"}, ranked by similarity.`
    : "No potential matches were found. Your report is saved in this browser; matches can appear when a similar report is added here.";
  matchResults.hidden = false;
}

reportOptions.forEach((option) => {
  option.addEventListener("click", () => {
    reportType = option.dataset.reportType;
    reportOptions.forEach((item) => {
      const isSelected = item === option;
      item.classList.toggle("is-active", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    const isLost = reportType === "lost";
    formHint.textContent = isLost
      ? "Let’s start with the item you’re looking for."
      : "Let’s start with the item you’ve come across.";
    submitLabel.textContent = "Check report details";
    feedback.textContent = "";
    clearMatchResults();
  });
});

fields.forEach((field) => {
  field.addEventListener("blur", () => validateField(field));
  field.addEventListener("input", () => {
    if (field.closest(".field").classList.contains("has-error")) {
      validateField(field);
    }
    if (field === description) {
      descriptionCount.textContent = `${description.value.length} / 500`;
    }
    feedback.textContent = "";
    clearMatchResults();
  });
  field.addEventListener("change", () => {
    if (field.closest(".field").classList.contains("has-error")) {
      validateField(field);
    }
    feedback.textContent = "";
    clearMatchResults();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const isValid = fields.map((field) => validateField(field)).every(Boolean);

  if (!isValid) {
    feedback.textContent = "Please fix the highlighted fields to continue.";
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const report = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    type: reportType,
    itemName: form.elements.itemName.value.trim(),
    category: form.elements.category.value,
    color: form.elements.color.value.trim(),
    description: form.elements.description.value.trim(),
    location: form.elements.location.value.trim(),
    date: form.elements.date.value,
    createdAt: new Date().toISOString(),
  };

  let savedReports;
  try {
    savedReports = loadSavedReports();
    saveReports([...savedReports, report]);
  } catch (error) {
    feedback.textContent = error.message;
    return;
  }

  const matches = findPotentialMatches(report, savedReports);
  feedback.textContent = `Your ${reportType} item report was saved in this browser.`;
  renderMatchResults(matches);
});
