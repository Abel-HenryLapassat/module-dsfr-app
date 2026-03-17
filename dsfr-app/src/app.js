import Simplicite from "simplicite";
import { LIST_VISIBLE, FORM_VISIBLE } from "./simplicite-utils";

// --- Route guard ---
const token = sessionStorage.getItem("simplicite_token");
if (!token) {
  window.location.href = "/index.html";
}

// --- Env & Session ---
const MENU_LAYOUT = import.meta.env.VITE_MENU_LAYOUT || "side";
const MODULE = import.meta.env.VITE_SIMPLICITE_MODULE || null;
const BASE_URL = sessionStorage.getItem("simplicite_base_url"); // from main.js login
const user = JSON.parse(sessionStorage.getItem("simplicite_user") || "{}"); // from main.js login

// --- Simplicité session ---
const app = Simplicite.session({
  url: BASE_URL,
  authtoken: token,
});

try {
  await app.login();
} catch (err) {
  // Token expired or invalid — send back to login
  console.error("Session invalide, redirection...", err);
  sessionStorage.clear();
  window.location.href = "/index.html";
}

// --- User info ---
const userBtn = document.getElementById("user-menu-btn");
if (userBtn && user.firstname) {
  userBtn.textContent = `${user.firstname} ${user.lastname}`;
}

document.getElementById("modal-login").textContent = user.login || "—";
document.getElementById("modal-name").textContent =
  `${user.firstname || ""} ${user.lastname || ""}`.trim() || "—";
document.getElementById("modal-email").textContent = user.email || "—";

// --- Logout ---
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "/index.html";
});

// --- Menu rendering (dsfr) ---
if (MENU_LAYOUT === "top") {
  renderTopNav();
} else {
  renderSideNav();
}

loadMenu();

function renderSideNav() {
  document.getElementById("side-nav-container").innerHTML = `
    <nav class="fr-sidemenu" aria-label="Menu principal">
      <div class="fr-sidemenu__inner">
        <button
          class="fr-sidemenu__btn"
          aria-controls="side-menu-list"
          aria-expanded="false"
        >
          Menu
        </button>
        <div id="side-menu-list" class="fr-collapse">
          <ul class="fr-sidemenu__list"></ul>
        </div>
      </div>
    </nav>
  `;
  document
    .getElementById("work-area-col")
    .classList.replace("fr-col-12", "fr-col-md-9");
}

function renderTopNav() {
  document.getElementById("header-nav-container").innerHTML = `
    <nav class="fr-nav" id="top-nav" role="navigation" aria-label="Menu principal">
      <ul class="fr-nav__list"></ul>
    </nav>
  `;
}

// --- Menu loading (simplicité) ---

async function loadMenu() {
  try {
    const domain = app.getBusinessObject("Domain");
    const domains = await domain.search();

    const MODULE = import.meta.env.VITE_SIMPLICITE_MODULE || null;
    const filtered = MODULE
      ? domains.filter((d) => d.row_module_id__mdl_name === MODULE)
      : domains;

    const menuData = await Promise.all(
      filtered.map(async (domain) => {
        const mapObj = app.getBusinessObject("Map");
        const items = await mapObj.search({
          map_domain_id__obd_name: domain.obd_name,
        });
        return {
          name: domain.obd_name,
          items: items,
        };
      }),
    );

    if (MENU_LAYOUT === "side") injectSideMenuItems(menuData);
    else injectTopMenuItems(menuData);
  } catch (err) {
    console.error("Erreur menu :", err);
  }
}

function injectSideMenuItems(menuData) {
  const list = document.querySelector(".fr-sidemenu__list");
  if (!list) return;

  list.innerHTML = menuData
    .map(
      (domain) => `
    <li class="fr-sidemenu__item">
      <button
        class="fr-sidemenu__btn"
        aria-expanded="false"
        aria-controls="domain-${domain.name}"
      >
        ${domain.name}
      </button>
      <div id="domain-${domain.name}" class="fr-collapse">
        <ul class="fr-sidemenu__list">
          ${(domain.items || [])
            .map(
              (item) => `
            <li class="fr-sidemenu__item">
              <a class="fr-sidemenu__link" href="#" data-object="${item.map_object.item.obo_name}">
                ${item.map_object.item.obo_name}
              </a>
            </li>
          `,
            )
            .join("")}
        </ul>
      </div>
    </li>
  `,
    )
    .join("");

  document
    .querySelectorAll(".fr-sidemenu__list .fr-sidemenu__btn")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("aria-controls");
        const target = document.getElementById(targetId);
        if (!target) return;

        const isExpanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!isExpanded));
        target.classList.toggle("fr-collapse--expanded", !isExpanded);
      });
    });

  document.querySelectorAll(".fr-sidemenu__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const objectName = e.currentTarget.getAttribute("data-object");
      loadObjectList(objectName);
    });
  });
}

function injectTopMenuItems(domains) {
  const list = document.querySelector(".fr-nav__list");
  if (!list) return;

  list.innerHTML = domains
    .map(
      (domain) => `
    <li class="fr-nav__item">
      <button
        class="fr-nav__btn"
        aria-expanded="false"
        aria-controls="nav-${domain.obd_name}"
      >
        ${domain.obd_name}
      </button>
      <div id="nav-${domain.obd_name}" class="fr-collapse fr-menu">
        <ul class="fr-menu__list">
          ${(domain.items || [])
            .map(
              (item) => `
            <li>
              <a class="fr-nav__link" href="#" data-object="${item.name}">
                ${item.label}
              </a>
            </li>
          `,
            )
            .join("")}
        </ul>
      </div>
    </li>
  `,
    )
    .join("");
}

// --- Theme switcher ---
function applyScheme(value) {
  document.documentElement.setAttribute("data-fr-theme", value);
  localStorage.setItem("fr-theme", value);
}

const currentScheme = localStorage.getItem("fr-theme") || "system";
const currentRadio = document.querySelector(
  `input[name="fr-radios-theme"][value="${currentScheme}"]`,
);
if (currentRadio) currentRadio.checked = true;

document.querySelectorAll('input[name="fr-radios-theme"]').forEach((radio) => {
  radio.addEventListener("change", (e) => applyScheme(e.target.value));
});

async function loadObjectList(objectName) {
  const workArea = document.getElementById("work-area");
  workArea.innerHTML = `<p class="fr-text--lead">Chargement...</p>`;

  try {
    const obj = app.getBusinessObject(objectName);

    // Get metadata and filter to list-visible fields only
    await obj.getMetaData();
    const fields = obj.metadata.fields.filter((f) =>
      LIST_VISIBLE.includes(f.visible),
    );

    // Fetch all rows
    const rows = await obj.search();

    workArea.innerHTML = renderTable(objectName, fields, rows);
  } catch (err) {
    workArea.innerHTML = `
      <div class="fr-alert fr-alert--error" role="alert">
        <h3 class="fr-alert__title">Erreur</h3>
        <p>Impossible de charger les données : ${err.message}</p>
      </div>
    `;
  }
}

function renderTable(objectName, fields, rows) {
  return `
    <h2 class="fr-h4">${objectName}</h2>
    <div class="fr-table fr-table--layout-fixed">
      <table>
        <thead>
          <tr>
            ${fields.map((f) => `<th scope="col">${f.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${
            rows.length === 0
              ? `<tr><td colspan="${fields.length}">Aucun enregistrement.</td></tr>`
              : rows
                  .map(
                    (row) => `
              <tr data-row-id="${row.row_id}" style="cursor:pointer;">
                ${fields.map((f) => `<td>${row[f.name] ?? "—"}</td>`).join("")}
              </tr>
            `,
                  )
                  .join("")
          }
        </tbody>
      </table>
    </div>
  `;
}
