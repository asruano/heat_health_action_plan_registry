// Load and initialize the table, map, and filters when the page loads
document.addEventListener("DOMContentLoaded", init);

async function init() {
  const plans = await loadPlans();

  if (document.getElementById("plansTableBody")) {
    populateCountryFilter(plans);
    renderTable(plans);
  }

  if (document.getElementById("map")) {
    initMap(plans);
  }
}

/* -----------------------------------------------------------
   LOAD DATA
------------------------------------------------------------ */

async function loadPlans() {
  const response = await fetch("plans_index.json");
  const data = await response.json();
  return data;
}

/* -----------------------------------------------------------
   DETERMINE PLAN LINK (UPDATED)
------------------------------------------------------------ */

function determinePlanLink(plan) {
  // Prefer a normal website URL
  if (plan.url && plan.url.startsWith("http")) {
    return { link: plan.url, type: "url" };
  }

  // GitHub-hosted PDF
  if (plan.pdf_link && plan.pdf_link.startsWith("http")) {
    return { link: plan.pdf_link, type: "pdf" };
  }

  // Legacy Drive PDF (older plans)
  if (plan.pdf_drive_link && plan.pdf_drive_link.startsWith("http")) {
    return { link: plan.pdf_drive_link, type: "pdf" };
  }

  return { link: null, type: null };
}

/* -----------------------------------------------------------
   POPULATE COUNTRY FILTER
------------------------------------------------------------ */

function populateCountryFilter(plans) {
  const select = document.getElementById("countryFilter");
  const countries = [...new Set(plans.map((p) => p.country).filter(Boolean))].sort();

  countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    select.appendChild(option);
  });
}

/* -----------------------------------------------------------
   RENDER TABLE (UPDATED LINK LOGIC)
------------------------------------------------------------ */

function renderTable(plans) {
  const tbody = document.getElementById("plansTableBody");
  const filterValue = document.getElementById("countryFilter").value.toLowerCase();
  const searchValue = document.getElementById("searchInput").value.toLowerCase();

  tbody.innerHTML = "";

  plans.forEach((plan) => {
    const countryMatch = !filterValue || plan.country.toLowerCase() === filterValue;
    const searchMatch =
      plan.title.toLowerCase().includes(searchValue) ||
      plan.country.toLowerCase().includes(searchValue) ||
      (plan.region || "").toLowerCase().includes(searchValue) ||
      (plan.city || "").toLowerCase().includes(searchValue);

    if (!countryMatch || !searchMatch) return;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${plan.title}</td>
      <td>${plan.country}</td>
      <td>${plan.region || ""}</td>
      <td>${plan.city || ""}</td>
      <td>${plan.year || ""}</td>
      <td>${plan.organization || ""}</td>
    `;

    // Link logic
    const linkTd = document.createElement("td");
    const { link, type } = determinePlanLink(plan);

    if (link) {
      const a = document.createElement("a");
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.className = "plan-link-btn";
      a.textContent = type === "pdf" ? "Download PDF" : "Open Plan";
      linkTd.appendChild(a);
    } else {
      linkTd.textContent = "No link available";
    }

    tr.appendChild(linkTd);
    tbody.appendChild(tr);
  });
}

/* -----------------------------------------------------------
   MAP INITIALIZATION
------------------------------------------------------------ */

function initMap(plans) {
  const map = L.map("map").setView([20, 0], 2);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 5,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  const groupedByCountry = groupPlansByCountry(plans);

  Object.entries(groupedByCountry).forEach(([country, plansInCountry]) => {
    const coords = lookupCountryCoords(country);
    if (!coords) return;

    const marker = L.marker(coords).addTo(map);
    marker.bindPopup(createCountryPopupHtml(country, plansInCountry));
  });
}

/* -----------------------------------------------------------
   GROUPING & POPUP CONTENT (UPDATED LINK LOGIC)
------------------------------------------------------------ */

function groupPlansByCountry(plans) {
  const grouped = {};

  plans.forEach((plan) => {
    if (!grouped[plan.country]) {
      grouped[plan.country] = [];
    }
    grouped[plan.country].push(plan);
  });

  return grouped;
}

function createCountryPopupHtml(country, plans) {
  let html = `<strong>${country}</strong><br><ul>`;

  plans.forEach((plan) => {
    const { link, type } = determinePlanLink(plan);
    const safeTitle = plan.title || "Unnamed plan";

    if (link) {
      const label = type === "pdf" ? "Download PDF" : "Open Plan";
      html += `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${safeTitle} – ${label}</a></li>`;
    } else {
      html += `<li>${safeTitle} (no link)</li>`;
    }
  });

  html += "</ul>";
  return html;
}

/* -----------------------------------------------------------
   COUNTRY COORDINATES
------------------------------------------------------------ */

function lookupCountryCoords(country) {
  const countryCoords = {
    "United States": [37.8, -96.9],
    "Canada": [56.1304, -106.3468],
    "Argentina": [-38.4161, -63.6167],
    "Australia": [-25.2744, 133.7751],
    "India": [20.5937, 78.9629],
    "China": [35.8617, 104.1954],
    "Japan": [36.2048, 138.2529],
    "France": [46.2276, 2.2137],
    "Germany:" [51.1657, 10.4515],
    "Spain": [40.4637, -3.7492],
    "Mexico": [23.6345, -102.5528],
    "Brazil": [-14.235, -51.9253],
    "South Africa": [-30.5595, 22.9375],
    "Italy": [41.8719, 12.5674],
    "Chile": [-35.6751, -71.543],
    "Peru": [-9.19, -75.0152]
  };

  return countryCoords[country] || null;
}

/* -----------------------------------------------------------
   FILTER EVENT LISTENERS
------------------------------------------------------------ */

document.getElementById("countryFilter")?.addEventListener("change", () => {
  loadPlans().then(renderTable);
});

document.getElementById("searchInput")?.addEventListener("input", () => {
  loadPlans().then(renderTable);
});
