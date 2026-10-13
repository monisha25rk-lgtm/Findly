const form = document.querySelector("#report-form");
const reportOptions = document.querySelectorAll("[data-report-type]");
const formHint = document.querySelector("#form-hint");
const submitLabel = document.querySelector("#submit-label");
const feedback = document.querySelector("#form-feedback");
const description = document.querySelector("#description");
const descriptionCount = document.querySelector("#description-count");
const dateInput = document.querySelector("#date");
const fields = [...form.querySelectorAll("input, select, textarea")];
const listingGrid = document.querySelector("#listing-grid");
const listingCount = document.querySelector("#listing-count");
const emptyListings = document.querySelector("#empty-listings");
const searchInput = document.querySelector("#listing-search");
const categoryFilter = document.querySelector("#category-filter");
const listingTypeOptions = document.querySelectorAll("[data-listing-type]");
const storageKey = "findly-listings";
const categories = [
  "Accessories",
  "Clothing",
  "Electronics",
  "Keys & cards",
  "Bags & luggage",
  "Books & stationery",
  "Other",
];

const imageByCategory = {
  Accessories: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80",
  Clothing: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80",
  Electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
  "Keys & cards": "https://images.unsplash.com/photo-1512412046876-f386342eddb3?auto=format&fit=crop&w=700&q=80",
  "Bags & luggage": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
  "Books & stationery": "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80",
  Other: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=700&q=80",
};

const sampleListings = [
  {
    id: "sample-watch",
    type: "found",
    name: "Silver wristwatch",
    category: "Accessories",
    color: "Silver",
    description: "A silver wristwatch with a dark blue face and a small scratch near the clasp.",
    location: "Student center, second floor",
    date: daysAgo(1),
    image: imageByCategory.Accessories,
  },
  {
    id: "sample-backpack",
    type: "lost",
    name: "Olive canvas backpack",
    category: "Bags & luggage",
    color: "Olive green",
    description: "Medium canvas backpack with a yellow keychain attached to the front pocket.",
    location: "West library reading room",
    date: daysAgo(2),
    image: imageByCategory["Bags & luggage"],
  },
  {
    id: "sample-headphones",
    type: "found",
    name: "Wireless headphones",
    category: "Electronics",
    color: "Black",
    description: "Black over-ear headphones in a soft zip case, left on a study table.",
    location: "Engineering building, room 204",
    date: daysAgo(2),
    image: imageByCategory.Electronics,
  },
  {
    id: "sample-notebook",
    type: "lost",
    name: "Pocket sketchbook",
    category: "Books & stationery",
    color: "Red",
    description: "Small red sketchbook with a few pencil drawings inside and a name on the first page.",
    location: "Cafeteria near the garden entrance",
    date: daysAgo(3),
    image: imageByCategory["Books & stationery"],
  },
  {
    id: "sample-jacket",
    type: "found",
    name: "Light denim jacket",
    category: "Clothing",
    color: "Blue",
    description: "Blue denim jacket with brass buttons and a stitched patch on the left sleeve.",
    location: "Sports hall reception",
    date: daysAgo(4),
    image: imageByCategory.Clothing,
  },
  {
    id: "sample-keys",
    type: "lost",
    name: "Keys with a green tag",
    category: "Keys & cards",
    color: "Silver and green",
    description: "Three silver keys on a ring with a small green leaf-shaped tag.",
    location: "Main quad near the fountain",
    date: daysAgo(5),
    image: imageByCategory["Keys & cards"],
  },
];

let reportType = "lost";
let activeListingType = "all";
let listings = loadListings();

const today = new Date();
dateInput.max = formatDateForInput(today);
renderListings();

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForInput(date);
}

function formatDateForInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function isListing(item) {
  return item !== null
    && typeof item === "object"
    && typeof item.id === "string"
    && (item.type === "lost" || item.type === "found")
    && typeof item.name === "string"
    && typeof item.category === "string"
    && typeof item.color === "string"
    && typeof item.description === "string"
    && typeof item.location === "string"
    && typeof item.date === "string"
    && typeof item.image === "string";
}

function loadListings() {
  try {
    const savedListings = localStorage.getItem(storageKey);
    if (savedListings === null) {
      localStorage.setItem(storageKey, JSON.stringify(sampleListings));
      return sampleListings;
    }

    const parsedListings = JSON.parse(savedListings);
    if (!Array.isArray(parsedListings) || !parsedListings.every(isListing)) {
      throw new Error("Saved listings have an unexpected format.");
    }
    return parsedListings;
  } catch (error) {
    feedback.textContent = "Saved items couldn't be loaded from this browser. Sample items are shown instead.";
    console.error("Unable to load Findly listings from local storage.", error);
    return sampleListings;
  }
}

function saveListings(items) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

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

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function createFallbackImage(item) {
  const iconByCategory = {
    Accessories: "⌚",
    Clothing: "♧",
    Electronics: "♫",
    "Keys & cards": "⚿",
    "Bags & luggage": "▱",
    "Books & stationery": "▤",
    Other: "✳",
  };
  const icon = iconByCategory[item.category] || "✳";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#e8eee7"/><circle cx="500" cy="75" r="120" fill="#d8e4d8"/><path d="M0 320 Q160 245 300 330 T600 300 V400 H0Z" fill="#d1dfd2"/><text x="300" y="245" text-anchor="middle" font-size="150" fill="#315b48">${icon}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createListingCard(item) {
  const card = createElement("article", "listing-card");
  const imageWrap = createElement("div", "listing-image-wrap");
  const image = createElement("img", "listing-image");
  image.src = item.image || imageByCategory[item.category] || imageByCategory.Other;
  image.alt = `Illustrative photo for ${item.name}`;
  image.loading = "lazy";
  image.onerror = () => {
    image.onerror = null;
    image.src = createFallbackImage(item);
  };

  const badge = createElement("span", "listing-type-badge", item.type);
  badge.dataset.type = item.type;
  imageWrap.append(image, badge);

  const content = createElement("div", "listing-card-content");
  const topline = createElement("div", "listing-card-topline");
  topline.append(
    createElement("span", "listing-category", item.category),
    createElement("time", "listing-date", formatListingDate(item.date)),
  );
  const title = createElement("h3", "", item.name);
  const summary = createElement("p", "listing-description", item.description);
  const location = createElement("p", "listing-location");
  location.append(createElement("span", "", "⌖"), document.createTextNode(item.location));
  content.append(topline, title, summary, location);
  card.append(imageWrap, content);
  return card;
}

function formatListingDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function renderListings() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const selectedCategory = categoryFilter.value;
  const filteredListings = listings.filter((item) => {
    const matchesType = activeListingType === "all" || item.type === activeListingType;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const searchableText = [
      item.name,
      item.category,
      item.color,
      item.description,
      item.location,
    ].join(" ").toLocaleLowerCase();
    return matchesType && matchesCategory && searchableText.includes(query);
  });

  listingGrid.replaceChildren(...filteredListings.map(createListingCard));
  listingCount.textContent = `${filteredListings.length} ${filteredListings.length === 1 ? "item" : "items"} found`;
  emptyListings.hidden = filteredListings.length !== 0;
}

function selectListingType(type) {
  activeListingType = type;
  listingTypeOptions.forEach((option) => {
    const isSelected = option.dataset.listingType === type;
    option.classList.toggle("is-active", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });
  renderListings();
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
    submitLabel.textContent = "Post item report";
    feedback.textContent = "";
  });
});

listingTypeOptions.forEach((option) => {
  option.addEventListener("click", () => selectListingType(option.dataset.listingType));
});

searchInput.addEventListener("input", renderListings);
categoryFilter.addEventListener("change", renderListings);

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

  const formData = new FormData(form);
  const item = {
    id: window.crypto?.randomUUID?.() || `item-${Date.now()}`,
    type: reportType,
    name: formData.get("itemName").trim(),
    category: formData.get("category"),
    color: formData.get("color").trim(),
    description: formData.get("description").trim(),
    location: formData.get("location").trim(),
    date: formData.get("date"),
    image: imageByCategory[formData.get("category")] || imageByCategory.Other,
  };
  const updatedListings = [item, ...listings];

  try {
    saveListings(updatedListings);
  } catch (error) {
    feedback.textContent = "Your report couldn't be saved. Check your browser storage settings and try again.";
    console.error("Unable to save Findly listing to local storage.", error);
    return;
  }

  listings = updatedListings;
  searchInput.value = "";
  categoryFilter.value = "all";
  selectListingType(reportType);
  feedback.textContent = `Your ${reportType} report was posted and saved in this browser.`;
  form.reset();
  descriptionCount.textContent = "0 / 500";
  fields.forEach((field) => updateFieldError(field, false));
  document.querySelector("#listings").scrollIntoView({ behavior: "smooth" });
});
