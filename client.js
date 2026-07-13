const clientAuthKey = "kfnClientAuthenticated";
const clientEmail = "client@kfnpharma.local";
const clientPassword = "client2026";
const clientProfile = {
  name: "Clinique Saint Gabriel",
  email: clientEmail,
  caseId: "RC-2026-0148",
  amount: 6600000
};

function fieldValue(form, name) {
  return form.querySelector(`[name="${name}"]`)?.value || "";
}

function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.setTimeout(() => element.classList.remove("show"), 2200);
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

function showClientActionPanel(actionType, label) {
  const panel = document.querySelector("#clientActionPanel");
  panel.hidden = false;

  if (actionType === "echeancier") {
    panel.innerHTML = `
      <form class="client-action-form" data-client-form="echeancier">
        <h3>Proposer un échéancier</h3>
        <p>Indique la date à laquelle tu proposes de régler, puis ajoute un commentaire si nécessaire.</p>
        <label>
          <span>Date d'échéance proposée</span>
          <input name="dueDate" type="date" required />
        </label>
        <label>
          <span>Montant proposé</span>
          <input name="amount" type="number" min="1" step="1000" value="${clientProfile.amount}" required />
        </label>
        <label>
          <span>Message à l'administration</span>
          <textarea name="message" rows="3" placeholder="Exemple : nous proposons de régler à cette date selon notre trésorerie."></textarea>
        </label>
        <div class="client-form-actions">
          <button class="primary-button" type="submit">Envoyer la demande</button>
          <button class="secondary-button" type="button" data-client-panel-close>Annuler</button>
        </div>
      </form>
    `;
    return;
  }

  if (actionType === "message") {
    panel.innerHTML = `
      <form class="client-action-form" data-client-form="message">
        <h3>Contacter le recouvrement</h3>
        <div class="contact-box">
          <strong>Chef de recouvrement</strong>
          <span>+225 01 71 76 98 07 / +225 07 59 10 26 84</span>
          <strong>Administration de recouvrement</strong>
          <span>+225 01 43 43 43 19</span>
        </div>
        <label>
          <span>Message à l'administration</span>
          <textarea name="message" rows="3" placeholder="Écris ici l'objet de ton message." required></textarea>
        </label>
        <div class="client-form-actions">
          <button class="primary-button" type="submit">Envoyer le message</button>
          <button class="secondary-button" type="button" data-client-panel-close>Fermer</button>
        </div>
      </form>
    `;
    return;
  }

  panel.innerHTML = `
    <form class="client-action-form" data-client-form="preuve_paiement">
      <h3>${label}</h3>
      <p>Ajoute la référence du paiement ou une précision pour que l'administration identifie le règlement.</p>
      <label>
        <span>Référence ou commentaire</span>
        <textarea name="message" rows="3" placeholder="Exemple : virement effectué, référence..." required></textarea>
      </label>
      <div class="client-form-actions">
        <button class="primary-button" type="submit">Envoyer la preuve</button>
        <button class="secondary-button" type="button" data-client-panel-close>Annuler</button>
      </div>
    </form>
  `;
}

function buildClientMessage(formType, form) {
  if (formType === "echeancier") {
    const dueDate = fieldValue(form, "dueDate");
    const amount = Number(fieldValue(form, "amount") || clientProfile.amount);
    const message = fieldValue(form, "message").trim();
    return [
      `Date d'échéance proposée : ${new Date(`${dueDate}T00:00:00`).toLocaleDateString("fr-FR")}`,
      `Montant proposé : ${formatMoney(amount)}`,
      message ? `Commentaire client : ${message}` : "Commentaire client : aucun commentaire ajouté."
    ].join("\n");
  }

  if (formType === "message") {
    return [
      "Demande de contact avec le recouvrement.",
      "Chef de recouvrement : +225 01 71 76 98 07 / +225 07 59 10 26 84",
      "Administration de recouvrement : +225 01 43 43 43 19",
      `Message client : ${fieldValue(form, "message").trim()}`
    ].join("\n");
  }

  return `Preuve de paiement : ${fieldValue(form, "message").trim()}`;
}

function validateClientActionForm(form) {
  const formType = form.dataset.clientForm;
  if (formType === "echeancier" && !fieldValue(form, "dueDate")) {
    toast("Ajoute une date d'échéance.");
    return false;
  }
  if (formType !== "echeancier" && !fieldValue(form, "message").trim()) {
    toast("Ajoute un message.");
    return false;
  }
  return true;
}

async function createClientRequest(actionType, label, message) {
  const status = document.querySelector("#clientActionStatus");
  if (status) status.textContent = "Transmission en cours...";

  const response = await fetch("/api/client-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientName: clientProfile.name,
      clientEmail: clientProfile.email,
      caseId: clientProfile.caseId,
      actionType,
      message: message || label,
      amount: clientProfile.amount
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

function submitClientActionForm(form) {
  if (!validateClientActionForm(form)) return;
  const formType = form.dataset.clientForm;
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  createClientRequest(formType, form.querySelector("h3")?.textContent || "Demande client", buildClientMessage(formType, form))
    .then(() => {
      toast("Demande envoyée à l'administration");
      document.querySelector("#clientActionPanel").hidden = true;
      document.querySelector("#clientActionPanel").innerHTML = "";
    })
    .catch((error) => toast(error.message))
    .finally(() => { submitButton.disabled = false; });
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
    const closePanel = event.target.closest("[data-client-panel-close]");
    const formSubmit = event.target.closest("[data-client-form] button[type='submit']");
    if (closePanel) {
      document.querySelector("#clientActionPanel").hidden = true;
      document.querySelector("#clientActionPanel").innerHTML = "";
      return;
    }
    if (formSubmit) {
      const form = formSubmit.closest("[data-client-form]");
      if (form) {
        event.preventDefault();
        submitClientActionForm(form);
      }
      return;
    }
    if (!action) return;
    showClientActionPanel(action.dataset.clientAction, action.dataset.clientLabel || "Demande client");
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-client-form]");
    if (!form) return;
    event.preventDefault();
    submitClientActionForm(form);
  });
}

function initClient() {
  bindClientEvents();
  if (isAuthenticated()) showClientPortal();
  else showClientAuth();
}

initClient();
