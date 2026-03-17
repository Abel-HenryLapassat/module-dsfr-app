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
    await obj.getMetaData();

    const fields = obj.metadata.fields.filter((f) =>
      LIST_VISIBLE.includes(f.visible),
    );
    const rows = await obj.search();

    // Pass metadata so renderTable can read rights + actions
    workArea.innerHTML = renderTable(objectName, obj.metadata, fields, rows);

    // Wire row clicks for future form navigation
    document.querySelectorAll("tr[data-row-id]").forEach((tr) => {
      tr.addEventListener("click", () => {
        const rowId = tr.getAttribute("data-row-id");
        const object = tr.getAttribute("data-object");
        console.log("Clicked row:", object, rowId); // placeholder for form loading
      });
    });

    // Wire dropdown toggle manually (same DSFR dynamic init issue as sidemenu)
    const dropdownBtn = document.getElementById(`btn-dropdown-${objectName}`);
    const dropdownList = document.getElementById(
      `actions-dropdown-${objectName}`,
    );
    if (dropdownBtn && dropdownList) {
      dropdownBtn.addEventListener("click", () => {
        const isOpen = dropdownBtn.getAttribute("aria-expanded") === "true";
        dropdownBtn.setAttribute("aria-expanded", String(!isOpen));
        dropdownList.style.display = isOpen ? "none" : "block";
      });
    }
    if (dropdownBtn && dropdownList) {
      dropdownBtn.addEventListener("click", () => {
        const isOpen = dropdownBtn.getAttribute("aria-expanded") === "true";
        dropdownBtn.setAttribute("aria-expanded", String(!isOpen));
        dropdownList.style.display = isOpen ? "none" : "block";
      });
    }
  } catch (err) {
    workArea.innerHTML = `
      <div class="fr-alert fr-alert--error" role="alert">
        <h3 class="fr-alert__title">Erreur</h3>
        <p>Impossible de charger les données : ${err.message}</p>
      </div>
    `;
  }
}

function renderTable(objectName, metadata, fields, rows) {
  const primaryActions = metadata.actions.filter(
    (a) => a.listVisible && a.enabled && !a.plus,
  );
  const dropdownActions = metadata.actions.filter(
    (a) => a.listVisible && a.enabled && a.plus,
  );

  return `
    <div class="fr-card fr-card--no-arrow" style="width:100%;">

      <!-- Card header -->
      <div class="fr-card__header">
        <div class="fr-card__img"></div>
        <ul class="fr-badges-group"></ul>
      </div>
      <div class="fr-card__body">
        <div class="fr-card__content">

          <!-- Title row -->
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1rem;">
            <div>
              <h2 class="fr-h5 fr-mb-0">${metadata.label}</h2>
              <p class="fr-text--sm fr-mb-0" style="color:var(--text-mention-grey)">Total ${rows.length}</p>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end;">

              ${
                metadata.create
                  ? `
                <button class="fr-btn fr-btn--sm" id="btn-create-${objectName}">
                  Créer
                </button>
              `
                  : ""
              }

              ${primaryActions
                .map(
                  (a) => `
                <button class="fr-btn fr-btn--sm fr-btn--secondary" data-action="${a.name}">
                  ${a.label}
                </button>
              `,
                )
                .join("")}

              ${
                dropdownActions.length > 0
                  ? `
                <div style="position:relative;">
                  <button
                    class="fr-btn fr-btn--sm fr-btn--secondary fr-btn--icon-right fr-icon-arrow-down-s-fill"
                    id="btn-dropdown-${objectName}"
                    aria-expanded="false"
                  >
                    Actions
                  </button>
                  <div
                    id="actions-dropdown-${objectName}"
                    style="
                      display:none;
                      position:absolute;
                      right:0;
                      top:100%;
                      z-index:100;
                      background:var(--background-default-grey);
                      border:1px solid var(--border-default-grey);
                      min-width:180px;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    "
                  >
                    <ul style="list-style:none; margin:0; padding:0.25rem 0;">
                      ${dropdownActions
                        .map(
                          (a) => `
                        <li>
                          <button
                            class="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
                            data-action="${a.name}"
                            style="width:100%; text-align:left; border-radius:0;"
                          >
                            ${a.label}
                          </button>
                        </li>
                      `,
                        )
                        .join("")}
                    </ul>
                  </div>
                </div>
              `
                  : ""
              }

            </div>
          </div>

          <!-- Table -->
          <div class="fr-table" style="width:100%; overflow-x:auto;">
            <table style="width:100%;">
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
                    <tr data-row-id="${row.row_id}" data-object="${objectName}" style="cursor:pointer;">
                      ${fields.map((f) => `<td>${row[f.name] ?? "—"}</td>`).join("")}
                    </tr>
                  `,
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- Card footer -->
      <div class="fr-card__footer" style="padding: 0.75rem 1.5rem;">
        <p class="fr-text--sm fr-mb-0" style="color:var(--text-mention-grey);">Total ${rows.length}</p>
      </div>

    </div>
  `;
}
