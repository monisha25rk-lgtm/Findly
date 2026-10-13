const form = document.querySelector("#report-form");
const reportOptions = document.querySelectorAll("[data-report-type]");
const formHint = document.querySelector("#form-hint");
const submitLabel = document.querySelector("#submit-label");
const feedback = document.querySelector("#form-feedback");
const description = document.querySelector("#description");
const descriptionCount = document.querySelector("#description-count");
const dateInput = document.querySelector("#date");
const fields = [...form.querySelectorAll("input, select, textarea")];

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
  });
  field.addEventListener("change", () => {
    if (field.closest(".field").classList.contains("has-error")) {
      validateField(field);
    }
    feedback.textContent = "";
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

  feedback.textContent = `Your ${reportType} item details are valid. Connect this form to a reporting service to submit them.`;
});
