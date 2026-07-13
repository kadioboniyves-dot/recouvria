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
    if (action) toast(action.dataset.clientAction);
  });
}

function initClient() {
  bindClientEvents();
  if (isAuthenticated()) showClientPortal();
  else showClientAuth();
}

initClient();
