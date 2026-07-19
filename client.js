const clientAuthKey = "kfnClientAuthenticated";
const clientPassword = "client2026";
const clientCases = [
  { id: "RC-2026-0148", name: "Clinique Saint Gabriel", contact: "Awa Kouame", phone: "+225 07 48 22 91 34", email: "awa.kouame@saintgabriel.ci", amount: 8450000, paid: 1850000, nextAction: "validation du plan de paiement" },
  { id: "RC-2026-0132", name: "BTP Horizon", contact: "Nicolas Bamba", phone: "+225 05 11 72 40 08", email: "nicolas.bamba@btphorizon.ci", amount: 12300000, paid: 3300000, nextAction: "mise en demeure" },
  { id: "RC-2026-0119", name: "Noura Distribution", contact: "Salimata Ouattara", phone: "+225 01 09 63 88 21", email: "salimata.ouattara@nouradistribution.ci", amount: 6200000, paid: 2700000, nextAction: "confirmation WhatsApp" },
  { id: "RC-2026-0105", name: "Logis Afrique", contact: "Hamed Diop", phone: "+225 27 22 45 09 10", email: "hamed.diop@logisafrique.ci", amount: 3800000, paid: 2400000, nextAction: "email de courtoisie" },
  { id: "RC-2026-0097", name: "AgroPlus CI", contact: "Moussa Fofana", phone: "+225 07 73 18 04 66", email: "moussa.fofana@agroplus.ci", amount: 9750000, paid: 4200000, nextAction: "escalade superviseur" },
  { id: "RC-2026-0088", name: "Transit Union", contact: "Eva N'Dri", phone: "+225 05 99 42 31 77", email: "eva.ndri@transitunion.ci", amount: 2900000, paid: 1600000, nextAction: "premier appel" }
];
let clientOrders = [
  { orderRef: "BC-2026-0518", client: "Clinique Saint Gabriel", product: "Consommables médicaux", amount: 3900000, status: "Non payée" },
  { orderRef: "BC-2026-0518", client: "Clinique Saint Gabriel", product: "Kits de stérilisation", amount: 900000, status: "Non payée" },
  { orderRef: "RC-2026-0148", client: "Clinique Saint Gabriel", product: "Solde ancien dossier", amount: 1800000, status: "Non payée" },
  { orderRef: "BC-2026-0520", client: "Noura Distribution", product: "Lots de marchandises", amount: 2200000, status: "Partiellement payée" },
  { orderRef: "RC-2026-0132", client: "BTP Horizon", product: "Solde dossier recouvrement", amount: 9000000, status: "Non payée" },
  { orderRef: "RC-2026-0105", client: "Logis Afrique", product: "Solde dossier recouvrement", amount: 1400000, status: "Non payée" },
  { orderRef: "RC-2026-0097", client: "AgroPlus CI", product: "Solde dossier recouvrement", amount: 5550000, status: "Non payée" },
  { orderRef: "RC-2026-0088", client: "Transit Union", product: "Solde dossier recouvrement", amount: 1300000, status: "Non payée" }
];
let clientProfileOverride = null;
let clientProfile = resolveClientProfile();

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resolveClientProfile() {
  if (clientProfileOverride) return clientProfileOverride;
  const params = new URLSearchParams(window.location.search);
  const caseId = params.get("dossier") || params.get("case") || "";
  const token = params.get("token") || "";
  if (token) return clientCases[0];
  return clientCases.find((item) => item.id.toLowerCase() === caseId.toLowerCase()) || clientCases[0];
}

function clientDue(profile = clientProfile) {
  return Math.max(0, Number(profile.amount || 0) - Number(profile.paid || 0));
}

function currentClientAuthKey() {
  return `${clientAuthKey}:${clientProfile.id}`;
}

function renderClientPortal() {
  clientProfile = resolveClientProfile();
  document.querySelector("#clientSessionName").textContent = clientProfile.name;
  document.querySelector("#clientHeroName").textContent = clientProfile.name;
  document.querySelector("#clientHeroMeta").textContent = `${clientProfile.contact} - ${clientProfile.email} - ${clientProfile.phone}`;
  document.querySelector("#clientBalanceAmount").textContent = formatMoney(clientDue());
  document.querySelector("#clientNextAction").textContent = `Prochaine action : ${clientProfile.nextAction}`;
  document.querySelector("#clientLoginForm input[name='email']").value = clientProfile.email;

  const rows = clientOrders.filter((order) => order.client.toLowerCase() === clientProfile.name.toLowerCase());
  document.querySelector("#clientInvoiceList").innerHTML = rows.map((order) => `
    <div>
      <strong>${escapeHtml(order.orderRef)}</strong>
      <span>${escapeHtml(order.product)}</span>
      <b>${formatMoney(order.amount)}</b>
    </div>
  `).join("") || `<div><strong>${escapeHtml(clientProfile.id)}</strong><span>Solde dossier recouvrement</span><b>${formatMoney(clientDue())}</b></div>`;
}

function applyPublicCase(payload) {
  if (!payload?.case) return false;
  const item = payload.case;
  clientProfileOverride = {
    id: item.id,
    name: item.client,
    contact: item.contact || "Service administratif",
    phone: item.phone || "",
    email: item.email || "",
    amount: Number(item.amount) || 0,
    paid: Number(item.paid) || 0,
    nextAction: item.nextAction || "suivi du dossier"
  };
  clientProfile = clientProfileOverride;
  clientOrders = (payload.orders || []).map((order) => ({
    orderRef: order.orderRef || order.id || clientProfile.id,
    client: order.client || clientProfile.name,
    product: order.product || "Solde dossier recouvrement",
    amount: Number(order.total || order.amount || 0),
    status: order.status || "Non payée"
  }));
  return true;
}

async function hydratePublicCase() {
  const params = new URLSearchParams(window.location.search);
  const dossier = params.get("dossier") || params.get("case") || "";
  const token = params.get("token") || "";
  if (!dossier && !token) return;
  try {
    const query = token ? `token=${encodeURIComponent(token)}` : `dossier=${encodeURIComponent(dossier)}`;
    const response = await fetch(`/api/public-case?${query}`);
    const payload = await response.json().catch(() => ({}));
    if (response.ok && applyPublicCase(payload)) renderClientPortal();
  } catch (error) {
    console.warn("Dossier public non synchronisé", error);
  }
}

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
          <input name="amount" type="number" min="1" step="1000" value="${clientDue()}" required />
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
    const amount = Number(fieldValue(form, "amount") || clientDue());
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
      caseId: clientProfile.id,
      actionType,
      message: message || label,
      amount: clientDue()
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
  return sessionStorage.getItem(currentClientAuthKey()) === "true";
}

function authenticate(form) {
  return fieldValue(form, "email").trim().toLowerCase() === clientProfile.email.toLowerCase() &&
    fieldValue(form, "password") === clientPassword;
}

function bindClientEvents() {
  document.querySelector("#clientLoginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!authenticate(event.currentTarget)) {
      showClientAuth("Email ou mot de passe incorrect.");
      return;
    }
    sessionStorage.setItem(currentClientAuthKey(), "true");
    showClientPortal();
    toast("Espace client ouvert");
  });

  document.querySelector("#clientLogoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(currentClientAuthKey());
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
  renderClientPortal();
  bindClientEvents();
  if (isAuthenticated()) showClientPortal();
  else showClientAuth();
  hydratePublicCase();
}

initClient();
