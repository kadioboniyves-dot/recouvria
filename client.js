const clientAuthKey = "kfnClientAuthenticated";
const clientEmail = "client@kfnpharma.local";
const clientPassword = "client2026";

function fieldValue(form, name) {
  return form.querySelector(`[name="${name}"]`)?.value || "";
}

function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.setTimeout(() => element.classList.remove("show"), 2200);
}

async function createClientRequest(actionType, label) {
  const note = window.prompt(`${label} : ajoute un commentaire pour l'administration`, "");
  const status = document.querySelector("#clientActionStatus");
  if (status) status.textContent = "Transmission en cours...";

  const response = await fetch("/api/client-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientName: "Clinique Saint Gabriel",
      clientEmail,
      caseId: "RC-2026-0148",
      actionType,
      message: note || label,
      amount: 6600000
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || "Demande non transmise";
    if (status) status.textContent = message;
    throw new Error(message);
  }

  if (status) status.textContent = "Demande transmise à l'administration.";
  return payload;
}

function showClientPortal() {
  document.querySelector("#clientAuthGate").hidden = true;
  document.querySelector("#clientPortal").hidden = false;
  document.body.classList.remove("auth-layout");
}

function showClientAuth(message = "") {
  document.querySelector("#clientAuthGate").hidden = false;
  document.querySelector("#clientPortal").hidden = true;
  document.querySelector("#clientLoginError").textContent = message;
  document.body.classList.add("auth-layout");
}

function isAuthenticated() {
  return sessionStorage.getItem(clientAuthKey) === "true";
}

function authenticate(form) {
  return fieldValue(form, "email").trim().toLowerCase() === clientEmail &&
    fieldValue(form, "password") === clientPassword;
}

function bindClientEvents() {
  document.querySelector("#clientLoginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!authenticate(event.currentTarget)) {
      showClientAuth("Email ou mot de passe incorrect.");
      return;
    }
    sessionStorage.setItem(clientAuthKey, "true");
    showClientPortal();
    toast("Espace client ouvert");
  });

  document.querySelector("#clientLogoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(clientAuthKey);
    showClientAuth("Session fermée.");
  });

  document.body.addEventListener("click", (event) => {
    const action = event.target.closest("[data-client-action]");
    if (!action) return;
    action.disabled = true;
    createClientRequest(action.dataset.clientAction, action.dataset.clientLabel || "Demande client")
      .then(() => toast("Demande envoyée à l'administration"))
      .catch((error) => toast(error.message))
      .finally(() => { action.disabled = false; });
  });
}

function initClient() {
  bindClientEvents();
  if (isAuthenticated()) showClientPortal();
  else showClientAuth();
}

initClient();
