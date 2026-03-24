import "./style.css";

const INSTANCE_URL = import.meta.env.VITE_SIMPLICITE_URL;

function setFieldError(groupId, message) {
  const group = document.getElementById(groupId);

  const isPasswordGroup = group.classList.contains("fr-password");
  if (!isPasswordGroup) {
    group.classList.add("fr-input-group--error");
  }

  group.querySelector("input").classList.add("fr-input--error");

  if (!group.querySelector(".fr-error-text")) {
    const p = document.createElement("p");
    p.className = "fr-error-text";
    group.appendChild(p);
  }
  group.querySelector(".fr-error-text").textContent = message;
}

function clearFieldError(groupId) {
  const group = document.getElementById(groupId);
  group.classList.remove("fr-input-group--error");
  group.querySelector("input").classList.remove("fr-input--error");
  group.querySelector(".fr-error-text")?.remove();
}

// --- Page-level alert helper ---

function showAlert(type, title, message) {
  document.getElementById("alert-zone").innerHTML = `
    <div class="fr-alert fr-alert--${type}" role="alert">
      <h3 class="fr-alert__title">${title}</h3>
      <p>${message}</p>
    </div>
  `;
}

// --- Simplicité API ---

async function loginToSimplicite(baseUrl, username, password) {
  const credentials = btoa(`${username}:${password}`);
  const url = `${baseUrl.replace(/\/$/, "")}/api/login`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok)
    throw new Error(data?.error || `Erreur HTTP ${response.status}`);

  return data;
}

// --- Form wiring ---

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  ["username-group", "password-group"].forEach(clearFieldError);
  document.getElementById("alert-zone").innerHTML = "";

  const baseUrl = INSTANCE_URL;
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  let hasError = false;
  if (!baseUrl || !/^https?:\/\/.+/.test(baseUrl)) {
    setFieldError("url-group", "URL invalide ou manquante.");
    hasError = true;
  }
  if (!username) {
    setFieldError("username-group", "L'identifiant est requis.");
    hasError = true;
  }
  if (!password) {
    setFieldError("password-group", "Le mot de passe est requis.");
    hasError = true;
  }
  if (hasError) return; // stop here if anything is wrong

  try {
    const user = await loginToSimplicite(baseUrl, username, password);
    // showAlert('success', 'Connexion réussie !', `Bienvenue, ${user.firstname} ${user.lastname}`);
    sessionStorage.setItem("simplicite_token", user.authtoken);
    sessionStorage.setItem("simplicite_base_url", baseUrl);
    sessionStorage.setItem("simplicite_user", JSON.stringify(user));
    // Redirect to the app "shell"
    window.location.href = "/app.html";
  } catch (err) {
    showAlert("error", "Échec de connexion", err.message);
  }
});

// --- Theme switcher ---

const currentScheme = "dark";
const currentRadio = document.querySelector(
  `input[name="fr-radios-theme"][value="${currentScheme}"]`,
);
if (currentRadio) currentRadio.checked = true;

document.querySelectorAll('input[name="fr-radios-theme"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    document.documentElement.setAttribute("data-fr-theme", e.target.value);
  });
});
