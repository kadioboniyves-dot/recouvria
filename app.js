const storageKey = "recouvriaCasesV4";
const orderStorageKey = "recouvriaOrdersV3";
const agentStorageKey = "recouvriaAgentsV1";
const clientStorageKey = "recouvriaClientsV1";
const letterStorageKey = "recouvriaLettersV1";
const publicAuthKey = "recouvriaPublicAuthenticated";
const publicLoginEmail = "admin@recouvria.local";
const publicLoginPassword = "recouvria2026";
const cloudStateEndpoint = "https://propose-moi-une-application-de-reco.vercel.app/api/state";

let apiMode = false;
let cloudSyncMode = false;
let currentUser = null;
let persistTimer = 0;
let isHydrating = false;

const seedCases = [
  {
    id: "RC-2026-0148",
    client: "Clinique Saint Gabriel",
    contact: "Awa Kouame",
    phone: "+225 07 48 22 91 34",
    email: "awa.kouame@saintgabriel.ci",
    amount: 8450000,
    paid: 1850000,
    delay: 46,
    risk: "high",
    agent: "Mariam Traore",
    status: "Négociation",
    nextAction: "Appel de validation du plan",
    nextDate: "Aujourd'hui 10:30",
    promise: "2 000 000 FCFA le 31/05",
    history: ["Email de relance envoyé", "Promesse partielle enregistrée", "Appel superviseur planifié"]
  },
  {
    id: "RC-2026-0132",
    client: "BTP Horizon",
    contact: "Nicolas Bamba",
    phone: "+225 05 11 72 40 08",
    email: "nicolas.bamba@btphorizon.ci",
    amount: 12300000,
    paid: 3300000,
    delay: 73,
    risk: "legal",
    agent: "Jean Koffi",
    status: "Précontentieux",
    nextAction: "Mise en demeure",
    nextDate: "Aujourd'hui 14:00",
    promise: "",
    history: ["3 appels sans réponse", "SMS formel envoyé", "Dossier proposé au contentieux"]
  },
  {
    id: "RC-2026-0119",
    client: "Noura Distribution",
    contact: "Salimata Ouattara",
    phone: "+225 01 09 63 88 21",
    email: "salimata.ouattara@nouradistribution.ci",
    amount: 6200000,
    paid: 2700000,
    delay: 29,
    risk: "medium",
    agent: "Mariam Traore",
    status: "Promesse",
    nextAction: "Confirmation WhatsApp",
    nextDate: "Demain 09:15",
    promise: "1 500 000 FCFA le 28/05",
    history: ["Relance WhatsApp ouverte", "Plan de paiement accepté", "Facture renvoyée"]
  },
  {
    id: "RC-2026-0105",
    client: "Logis Afrique",
    contact: "Hamed Diop",
    phone: "+225 27 22 45 09 10",
    email: "hamed.diop@logisafrique.ci",
    amount: 3800000,
    paid: 2400000,
    delay: 18,
    risk: "low",
    agent: "Prisca Toure",
    status: "Relancé",
    nextAction: "Email de courtoisie",
    nextDate: "Vendredi 11:00",
    promise: "",
    history: ["Facture consultée", "Premier rappel envoyé", "Client demande duplicata"]
  },
  {
    id: "RC-2026-0097",
    client: "AgroPlus CI",
    contact: "Moussa Fofana",
    phone: "+225 07 73 18 04 66",
    email: "moussa.fofana@agroplus.ci",
    amount: 9750000,
    paid: 4200000,
    delay: 57,
    risk: "high",
    agent: "Jean Koffi",
    status: "Négociation",
    nextAction: "Escalade superviseur",
    nextDate: "Aujourd'hui 16:45",
    promise: "2 versements à confirmer",
    history: ["Appel direction financière", "Demande d'échéancier", "Rappel pénalités envoyé"]
  },
  {
    id: "RC-2026-0088",
    client: "Transit Union",
    contact: "Eva N'Dri",
    phone: "+225 05 99 42 31 77",
    email: "eva.ndri@transitunion.ci",
    amount: 2900000,
    paid: 1600000,
    delay: 12,
    risk: "low",
    agent: "Prisca Toure",
    status: "Nouveau",
    nextAction: "Premier appel",
    nextDate: "Demain 15:00",
    promise: "",
    history: ["Dossier importé", "Coordonnées vérifiées"]
  }
];

const seedOrders = [
  {
    id: "CMD-2026-0001",
    orderRef: "BC-2026-0518",
    client: "Clinique Saint Gabriel",
    product: "Consommables médicaux",
    packaging: "Boîte",
    quantity: 12,
    unitPrice: 325000,
    total: 3900000,
    date: "2026-05-18",
    status: "Non payée",
    caseId: ""
  },
  {
    id: "CMD-2026-0002",
    orderRef: "BC-2026-0518",
    client: "Clinique Saint Gabriel",
    product: "Kits de stérilisation",
    packaging: "Carton",
    quantity: 5,
    unitPrice: 180000,
    total: 900000,
    date: "2026-05-18",
    status: "Non payée",
    caseId: ""
  },
  {
    id: "CMD-2026-0003",
    orderRef: "BC-2026-0520",
    client: "Noura Distribution",
    product: "Lots de marchandises",
    packaging: "Carton",
    quantity: 8,
    unitPrice: 275000,
    total: 2200000,
    date: "2026-05-20",
    status: "Partiellement payée",
    caseId: ""
  },
  {
    id: "CMD-2026-0004",
    orderRef: "BC-2026-0522",
    client: "Logis Afrique",
    product: "Prestations logistiques",
    packaging: "Unité",
    quantity: 3,
    unitPrice: 450000,
    total: 1350000,
    date: "2026-05-22",
    status: "Payée",
    caseId: ""
  }
];

const orderStatuses = ["Non payée", "Partiellement payée", "Payée"];
const orderPackagingOptions = ["Unité", "Boîte", "Carton"];

const seedAgents = [
  { id: "AG-001", name: "Mariam Traore", email: "mariam.traore@recouvria.ci", phone: "+225 07 10 20 30 40", role: "Lead recouvrement", recovered: 14800000, target: 20000000, cases: 18, active: true },
  { id: "AG-002", name: "Jean Koffi", email: "jean.koffi@recouvria.ci", phone: "+225 05 44 22 10 20", role: "Chargé précontentieux", recovered: 11900000, target: 18000000, cases: 21, active: true },
  { id: "AG-003", name: "Prisca Toure", email: "prisca.toure@recouvria.ci", phone: "+225 01 88 73 40 12", role: "Chargée portefeuille", recovered: 9700000, target: 14000000, cases: 14, active: true }
];

let cases = loadCases();
let orders = loadOrders();
let agents = loadAgents();
let clients = loadClients();
let letters = loadLetters();
let clientRequests = [];
let clientRequestsConfigured = null;

const channels = [
  { label: "Appels sortants", count: 46, rate: 78 },
  { label: "SMS automatiques", count: 132, rate: 63 },
  { label: "Emails suivis", count: 84, rate: 57 },
  { label: "WhatsApp Business", count: 51, rate: 71 }
];

const steps = [
  ["J+1", "Rappel courtois", "SMS et email automatique avec copie facture."],
  ["J+7", "Relance active", "Appel agent, qualification du motif et proposition d'échéancier."],
  ["J+15", "Engagement", "Promesse de paiement datée avec rappel avant échéance."],
  ["J+30", "Précontentieux", "Mise en demeure, blocage commercial et revue superviseur."]
];

let activeFilter = "all";
let activeAgent = "all";
let activeStatus = "active";
let searchTerm = "";
let sheetRows = 5;

const statusOptions = ["Nouveau", "Relancé", "Négociation", "Promesse", "Précontentieux", "Contentieux", "Clôturé"];
const riskOptions = [
  ["low", "Faible"],
  ["medium", "Moyen"],
  ["high", "Elevé"],
  ["legal", "Contentieux"]
];
const reminderChannels = [
  ["call", "Appel"],
  ["sms", "SMS"],
  ["email", "Email"],
  ["whatsapp", "WhatsApp"],
  ["notice", "Mise en demeure"]
];
const paymentMethods = ["Espèces", "Mobile Money", "Virement", "Chèque", "Carte"];

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0
});

function formatMoney(value) {
  return currency.format(value).replace("XOF", "FCFA");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function defaultEmail(item) {
  const slug = String(item.client || "client")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.|\.$)/g, "");
  return `recouvrement@${slug || "client"}.ci`;
}

function normalizeCases(items) {
  return items.map((item) => {
    const nextItem = { ...item, archived: Boolean(item.archived), history: item.history || [] };
    nextItem.email = nextItem.email || defaultEmail(nextItem);
    const due = Math.max(0, Number(nextItem.amount) - Number(nextItem.paid));
    if (due === 0 && Number(nextItem.amount) > 0) {
      nextItem.paid = nextItem.amount;
      nextItem.status = "Clôturé";
      nextItem.risk = "low";
      nextItem.promise = "";
      nextItem.nextAction = "Dossier soldé";
      nextItem.nextDate = "Aucune";
    }
    return nextItem;
  });
}

function loadCases() {
  try {
    const stored = localStorage.getItem(storageKey);
    return normalizeCases(stored ? JSON.parse(stored) : structuredClone(seedCases));
  } catch {
    return normalizeCases(structuredClone(seedCases));
  }
}

function saveCases() {
  localStorage.setItem(storageKey, JSON.stringify(cases));
  syncClientsFromRecords();
  queuePersistState();
}

function parseAmount(value) {
  if (typeof value === "number") return value;
  const normalized = String(value || "")
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(",", ".");
  return Math.max(0, Number(normalized) || 0);
}

function normalizePackaging(value) {
  const normalized = normalizeHeader(value);
  if (["boite", "boites", "box"].includes(normalized)) return "Boîte";
  if (["carton", "cartons"].includes(normalized)) return "Carton";
  if (["unite", "unites", "piece", "pieces", "unit"].includes(normalized)) return "Unité";
  return "Unité";
}

function normalizeOrders(items) {
  return items.map((item, index) => {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = parseAmount(item.unitPrice);
    const total = parseAmount(item.total) || quantity * unitPrice;
    return {
      id: item.id || `CMD-2026-${String(index + 1).padStart(4, "0")}`,
      orderRef: item.orderRef || item.commandRef || item.reference || item.id || `BC-2026-${String(index + 1).padStart(4, "0")}`,
      client: String(item.client || "").trim(),
      product: String(item.product || "").trim(),
      packaging: normalizePackaging(item.packaging || item.conditionnement || item.conditioning || item.unite || item.unit),
      quantity,
      unitPrice,
      total,
      date: item.date || todayInputValue(),
      status: orderStatuses.includes(item.status) ? item.status : "Non payée",
      caseId: item.caseId || ""
    };
  });
}

function loadOrders() {
  try {
    const stored = localStorage.getItem(orderStorageKey);
    return normalizeOrders(stored ? JSON.parse(stored) : structuredClone(seedOrders));
  } catch {
    return normalizeOrders(structuredClone(seedOrders));
  }
}

function saveOrders() {
  localStorage.setItem(orderStorageKey, JSON.stringify(orders));
  syncClientsFromRecords();
  queuePersistState();
}

function normalizeAgents(items) {
  return items.map((item, index) => ({
    id: item.id || `AG-${String(index + 1).padStart(3, "0")}`,
    name: String(item.name || "").trim(),
    email: String(item.email || "").trim(),
    phone: String(item.phone || "").trim(),
    role: String(item.role || "Chargé recouvrement").trim(),
    recovered: Math.max(0, Number(item.recovered) || 0),
    target: Math.max(0, Number(item.target) || 0),
    cases: Math.max(0, Number(item.cases) || 0),
    active: item.active !== false
  })).filter((item) => item.name);
}

function loadAgents() {
  try {
    const stored = localStorage.getItem(agentStorageKey);
    return normalizeAgents(stored ? JSON.parse(stored) : structuredClone(seedAgents));
  } catch {
    return normalizeAgents(structuredClone(seedAgents));
  }
}

function saveAgents() {
  localStorage.setItem(agentStorageKey, JSON.stringify(agents));
  renderAgentFilter();
  queuePersistState();
}

function clientIdFromName(name) {
  const slug = String(name || "client")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36) || "client";
  return `CL-${slug.toUpperCase()}`;
}

function buildClientsFromRecords(caseRows = cases, orderRows = orders) {
  const map = new Map();
  const addClient = (item) => {
    const name = String(item.client || item.name || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    const current = map.get(key) || {
      id: item.id?.startsWith?.("CL-") ? item.id : clientIdFromName(name),
      name,
      contact: "",
      phone: "",
      email: "",
      segment: "B2B",
      notes: ""
    };
    current.contact = current.contact || item.contact || "Service administratif";
    current.phone = current.phone || item.phone || "";
    current.email = current.email || item.email || defaultEmail({ client: name });
    current.segment = current.segment || (item.risk === "legal" ? "Précontentieux" : "B2B");
    current.notes = current.notes || (item.agent ? `Client suivi par ${item.agent}.` : "");
    map.set(key, current);
  };

  caseRows.forEach(addClient);
  orderRows.forEach(addClient);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

function normalizeClients(items) {
  const source = Array.isArray(items) && items.length ? items : buildClientsFromRecords();
  return source.map((item) => ({
    id: item.id || clientIdFromName(item.name),
    name: String(item.name || "").trim(),
    contact: String(item.contact || "Service administratif").trim(),
    phone: String(item.phone || "").trim(),
    email: String(item.email || "").trim(),
    segment: String(item.segment || "B2B").trim(),
    notes: String(item.notes || "").trim()
  })).filter((item) => item.name);
}

function loadClients() {
  try {
    const stored = localStorage.getItem(clientStorageKey);
    return normalizeClients(stored ? JSON.parse(stored) : buildClientsFromRecords(seedCases, seedOrders));
  } catch {
    return normalizeClients(buildClientsFromRecords(seedCases, seedOrders));
  }
}

function saveClients() {
  localStorage.setItem(clientStorageKey, JSON.stringify(clients));
  queuePersistState();
}

function normalizeLetters(items) {
  return (items || []).map((item) => ({
    id: item.id || nextLetterId(),
    caseId: item.caseId || "",
    client: item.client || "",
    subject: item.subject || "Lettre de relance",
    type: item.type || "Relance",
    content: item.content || "",
    status: item.status || "Brouillon",
    createdAt: item.createdAt || new Date().toISOString()
  }));
}

function loadLetters() {
  try {
    const stored = localStorage.getItem(letterStorageKey);
    return normalizeLetters(stored ? JSON.parse(stored) : []);
  } catch {
    return [];
  }
}

function saveLetters() {
  localStorage.setItem(letterStorageKey, JSON.stringify(letters));
  queuePersistState();
}

function syncClientsFromRecords() {
  if (isHydrating) return;
  const known = new Map(clients.map((item) => [item.name.toLowerCase(), item]));
  buildClientsFromRecords(cases, orders).forEach((item) => {
    const existing = known.get(item.name.toLowerCase());
    if (existing) {
      existing.contact ||= item.contact;
      existing.phone ||= item.phone;
      existing.email ||= item.email;
      existing.segment ||= item.segment;
      existing.notes ||= item.notes;
      return;
    }
    known.set(item.name.toLowerCase(), item);
  });
  clients = [...known.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  localStorage.setItem(clientStorageKey, JSON.stringify(clients));
}

function statePayload() {
  return { cases, orders, agents, clients, letters };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : {};
  if (!response.ok) {
    const error = new Error(payload.error || `Erreur API ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function queuePersistState() {
  if ((!apiMode && !cloudSyncMode) || isHydrating) return;
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(async () => {
    try {
      if (apiMode) {
        await apiRequest("/api/state", {
          method: "PUT",
          body: JSON.stringify(statePayload())
        });
        await persistCloudState();
      } else {
        await apiRequest("/api/state", {
          method: "PUT",
          headers: { "x-recouvria-admin-password": publicLoginPassword },
          body: JSON.stringify(statePayload())
        });
      }
      updateSessionBadge(cloudSyncMode && !apiMode ? "Base Supabase synchronisée" : "Base synchronisée PC + cloud");
    } catch (error) {
      console.error(error);
      updateSessionBadge(cloudSyncMode && !apiMode ? "Synchro Supabase en attente" : "Synchro en attente");
    }
  }, 350);
}

function applyBootstrap(payload) {
  isHydrating = true;
  cases = normalizeCases(payload.cases || seedCases);
  orders = normalizeOrders(payload.orders || seedOrders);
  agents = normalizeAgents(payload.agents || seedAgents);
  clients = normalizeClients(payload.clients || buildClientsFromRecords(cases, orders));
  letters = normalizeLetters(payload.letters || []);
  localStorage.setItem(storageKey, JSON.stringify(cases));
  localStorage.setItem(orderStorageKey, JSON.stringify(orders));
  localStorage.setItem(agentStorageKey, JSON.stringify(agents));
  localStorage.setItem(clientStorageKey, JSON.stringify(clients));
  localStorage.setItem(letterStorageKey, JSON.stringify(letters));
  isHydrating = false;
}

function refreshViews() {
  renderKpis();
  renderPriorityList();
  renderTable();
  renderRelances();
  renderPayments();
  renderReports();
  renderOrders();
  renderClients();
  renderAgentsAdmin();
  renderLetters();
  renderClientRequests();
}

function nextCaseId() {
  const maxNumber = cases.reduce((max, item) => {
    const number = Number(item.id.split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);

  return `RC-2026-${String(maxNumber + 1).padStart(4, "0")}`;
}

function nextOrderId() {
  const maxNumber = orders.reduce((max, item) => {
    const number = Number(String(item.id).split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);

  return `CMD-2026-${String(maxNumber + 1).padStart(4, "0")}`;
}

function nextAgentId() {
  const maxNumber = agents.reduce((max, item) => {
    const number = Number(String(item.id || "").split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `AG-${String(maxNumber + 1).padStart(3, "0")}`;
}

function nextClientId() {
  const maxNumber = clients.reduce((max, item) => {
    const number = Number(String(item.id || "").split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `CL-${String(maxNumber + 1).padStart(3, "0")}`;
}

function nextLetterId() {
  const year = new Date().getFullYear();
  const maxNumber = letters.reduce((max, item) => {
    const number = Number(String(item.id || "").split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);
  return `LR-${year}-${String(maxNumber + 1).padStart(4, "0")}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getCase(id) {
  return cases.find((item) => item.id === id);
}

function getOrder(id) {
  return orders.find((item) => item.id === id);
}

function addHistory(item, message) {
  item.history = [message, ...(item.history || [])].slice(0, 8);
}

function remainingAmount(item) {
  return Math.max(0, item.amount - item.paid);
}

function channelLabel(channel) {
  return reminderChannels.find(([value]) => value === channel)?.[1] || channel;
}

function cleanPhone(phone) {
  return String(phone || "").replace(/[^\d+]/g, "");
}

function reminderSubject(item) {
  return `Relance dossier ${item.id} - Recouvria`;
}

function reminderMessage(item, note = "") {
  const due = formatMoney(remainingAmount(item));
  return [
    `Bonjour ${item.contact},`,
    "",
    `Nous vous contactons concernant le dossier ${item.id} (${item.client}).`,
    `Montant restant dû : ${due}.`,
    item.promise ? `Engagement en cours : ${item.promise}.` : "",
    note ? `Note : ${note}` : "",
    "",
    "Merci de nous confirmer votre disposition pour le règlement.",
    "Service recouvrement"
  ].filter(Boolean).join("\n");
}

function openCommunicationLink(item, channel, note = "") {
  const message = encodeURIComponent(reminderMessage(item, note));
  const subject = encodeURIComponent(reminderSubject(item));
  const phone = cleanPhone(item.phone);

  if (channel === "call" && phone) {
    window.location.href = `tel:${phone}`;
    return true;
  }

  if (channel === "sms" && phone) {
    window.location.href = `sms:${phone}?body=${message}`;
    return true;
  }

  if (channel === "email" && item.email) {
    window.location.href = `mailto:${encodeURIComponent(item.email)}?subject=${subject}&body=${message}`;
    return true;
  }

  if (channel === "whatsapp" && phone) {
    window.open(`https://wa.me/${phone.replace("+", "")}?text=${message}`, "_blank", "noopener");
    return true;
  }

  return false;
}

async function sendEmailViaResend({ to, subject, text, html }) {
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-recouvria-admin-password": publicLoginPassword
    },
    body: JSON.stringify({ to, subject, text, html })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error || payload.configured === false) {
    throw new Error(payload.error || "Email non envoyé");
  }
  return payload;
}

function openMailto(to, subject, text) {
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
}

function fieldValue(form, name) {
  const field = form.querySelector(`[name="${name}"]`);
  return field ? field.value : "";
}

function riskLabel(risk) {
  return {
    low: "Faible",
    medium: "Moyen",
    high: "Elevé",
    legal: "Contentieux"
  }[risk];
}

function statusClass(item) {
  if (item.status === "Clôturé") return "low";
  if (item.status.toLowerCase().includes("contentieux") || item.status.includes("Précontentieux")) return "legal";
  if (item.status.includes("Promesse")) return "promise";
  return "neutral";
}

function orderStatusClass(status) {
  if (status === "Payée") return "low";
  if (status === "Partiellement payée") return "promise";
  return "high";
}

function getFilteredCases() {
  return cases.filter((item) => {
    const haystack = `${item.id} ${item.client} ${item.contact} ${item.phone} ${item.email} ${item.agent} ${item.status}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm);
    const matchesAgent = activeAgent === "all" || item.agent === activeAgent;
    const matchesStatus =
      activeStatus === "active"
        ? !item.archived
        : activeStatus === "archived"
          ? item.archived
          : !item.archived && item.status === activeStatus;
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "urgent" && (item.risk === "high" || item.risk === "legal")) ||
      (activeFilter === "promise" && item.promise) ||
      (activeFilter === "legal" && item.risk === "legal");

    return matchesSearch && matchesAgent && matchesStatus && matchesFilter;
  });
}

function renderKpis() {
  ensureOrderCases();
  const activeCases = cases.filter((item) => !item.archived);
  const totalDue = activeCases.reduce((sum, item) => sum + item.amount - item.paid, 0);
  const recovered = activeCases.reduce((sum, item) => sum + item.paid, 0);
  const urgent = activeCases.filter((item) => remainingAmount(item) > 0 && (item.risk === "high" || item.risk === "legal")).length;
  const promises = activeCases.filter((item) => remainingAmount(item) > 0 && item.promise).length;
  const unpaidOrders = orders.filter((item) => item.status !== "Payée").reduce((sum, item) => sum + item.total, 0);

  const data = [
    ["C", "Créances nettes", formatMoney(totalDue), "+8 dossiers cette semaine", "var(--teal-soft)", "var(--teal)"],
    ["O", "Commandes impayées", formatMoney(unpaidOrders), "Intégrées au portefeuille", "var(--blue-soft)", "var(--blue)"],
    ["R", "Recouvré", formatMoney(recovered), "Taux global 44%", "var(--green-soft)", "var(--green)"],
    ["U", "Dossiers urgents", urgent, "Priorité superviseur", "var(--red-soft)", "var(--red)"],
    ["P", "Promesses actives", promises, "A surveiller avant échéance", "var(--amber-soft)", "var(--amber)"]
  ];

  document.querySelector("#kpiGrid").innerHTML = data.map(([icon, label, value, note, bg, color]) => `
    <article class="kpi">
      <span style="background:${bg};color:${color}">${icon}</span>
      <strong>${value}</strong>
      <small>${label}</small>
      <p class="eyebrow" style="margin-top:12px">${note}</p>
    </article>
  `).join("");
}

function renderPriorityList() {
  const priority = cases
    .filter((item) => !item.archived && remainingAmount(item) > 0 && (item.risk === "high" || item.risk === "legal"))
    .slice(0, 4);

  document.querySelector("#priorityList").innerHTML = priority.map((item) => `
    <article class="case-card">
      <div>
        <div class="meta-row">
          <span class="badge ${item.risk}">${riskLabel(item.risk)}</span>
          <span class="badge neutral">${item.id}</span>
        </div>
        <h3>${item.client}</h3>
        <p>${item.nextAction} - ${item.nextDate}</p>
      </div>
      <button class="secondary-button" type="button" data-open="${item.id}">Ouvrir</button>
    </article>
  `).join("");
}

function renderChart() {
  const months = [
    ["Jan", 44], ["Fev", 58], ["Mar", 51], ["Avr", 66], ["Mai", 82], ["Juin", 74]
  ];

  document.querySelector("#collectionChart").innerHTML = months.map(([label, value]) => `
    <div class="bar">
      <span style="height:${value * 2}px"></span>
      <strong>${value}%</strong>
      <small>${label}</small>
    </div>
  `).join("");
}

function renderChannels() {
  document.querySelector("#channelList").innerHTML = channels.map((channel) => `
    <article class="channel-row">
      <div>
        <strong>${channel.label}</strong>
        <div class="channel-meter"><span style="width:${channel.rate}%"></span></div>
      </div>
      <span class="badge neutral">${channel.count}</span>
    </article>
  `).join("");
}

function clientRequestLabel(type) {
  return {
    preuve_paiement: "Preuve de paiement",
    echeancier: "Demande d'échéancier",
    message: "Message client"
  }[type] || type || "Demande";
}

function getClientRequest(id) {
  return clientRequests.find((request) => request.id === id);
}

function requestStatusClass(status) {
  return {
    traité: "low",
    accordé: "low",
    refusé: "high",
    nouveau: "promise"
  }[status] || "promise";
}

function formatRequestMessage(message) {
  return escapeHtml(message || "Aucun message fourni.").replace(/\n/g, "<br>");
}

function renderClientRequests() {
  const list = document.querySelector("#clientRequestList");
  if (!list) return;

  if (clientRequestsConfigured === false) {
    list.innerHTML = `
      <article class="empty-state">
        <h3>Supabase non configuré</h3>
        <p>Ajoute les variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel pour recevoir les demandes client.</p>
      </article>
    `;
    return;
  }

  if (!clientRequests.length) {
    list.innerHTML = `
      <article class="empty-state">
        <h3>Aucune demande client</h3>
        <p>Les preuves de paiement, échéanciers et messages envoyés depuis le lien client apparaîtront ici.</p>
      </article>
    `;
    return;
  }

  list.innerHTML = clientRequests.map((request) => `
    <article class="client-request-card">
      <div>
        <div class="meta-row">
          <span class="badge ${requestStatusClass(request.status)}">${escapeHtml(request.status || "nouveau")}</span>
          <span class="badge neutral">${escapeHtml(clientRequestLabel(request.action_type))}</span>
        </div>
        <h3>${escapeHtml(request.client_name || "Client")}</h3>
        <p>${escapeHtml(request.message || "Aucun message")}</p>
        <small>${escapeHtml(request.case_id || "")} - ${new Date(request.created_at).toLocaleString("fr-FR")}</small>
      </div>
      <div class="inline-actions">
        <button class="primary-button" type="button" data-client-request-open="${escapeHtml(request.id)}">Ouvrir</button>
        <button class="secondary-button" type="button" ${request.status === "traité" ? "disabled" : `data-client-request-done="${escapeHtml(request.id)}"`}>Marquer traitée</button>
      </div>
    </article>
  `).join("");
}

function openClientRequest(id) {
  const request = getClientRequest(id);
  if (!request) {
    toast("Demande introuvable");
    return;
  }

  const createdAt = request.created_at
    ? new Date(request.created_at).toLocaleString("fr-FR")
    : "Date non disponible";
  const amount = Number(request.amount || 0);

  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">Demande client</p>
      <h2>${escapeHtml(clientRequestLabel(request.action_type))}</h2>
      <p>${escapeHtml(request.client_name || "Client")} - ${escapeHtml(request.client_email || "")}</p>
      <div class="meta-row">
        <span class="badge ${requestStatusClass(request.status)}">${escapeHtml(request.status || "nouveau")}</span>
        <span class="badge neutral">${escapeHtml(request.case_id || "Sans dossier")}</span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-stat"><span>Client</span><strong>${escapeHtml(request.client_name || "-")}</strong></div>
      <div class="detail-stat"><span>Email</span><strong>${escapeHtml(request.client_email || "-")}</strong></div>
      <div class="detail-stat"><span>Dossier</span><strong>${escapeHtml(request.case_id || "-")}</strong></div>
      <div class="detail-stat"><span>Montant</span><strong>${amount ? formatMoney(amount) : "-"}</strong></div>
      <div class="detail-stat"><span>Type</span><strong>${escapeHtml(clientRequestLabel(request.action_type))}</strong></div>
      <div class="detail-stat"><span>Reçu le</span><strong>${escapeHtml(createdAt)}</strong></div>
    </div>

    <section class="request-message-box">
      <p class="eyebrow">Message complet</p>
      <p>${formatRequestMessage(request.message)}</p>
    </section>

    <div class="drawer-actions">
      ${request.action_type === "echeancier" && request.status === "nouveau" ? `
        <button class="primary-button" type="button" data-client-request-status="${escapeHtml(request.id)}" data-client-request-next-status="accordé">Accorder l'échéancier</button>
        <button class="secondary-button" type="button" data-client-request-status="${escapeHtml(request.id)}" data-client-request-next-status="refusé">Refuser</button>
      ` : ""}
      <button class="primary-button" type="button" ${request.status === "traité" ? "disabled" : `data-client-request-done="${escapeHtml(request.id)}"`}>Marquer traitée</button>
      ${request.case_id ? `<button class="secondary-button" type="button" data-open="${escapeHtml(request.case_id)}">Voir dossier</button>` : ""}
      <button class="secondary-button" type="button" data-client-request-email="${escapeHtml(request.client_email || "")}">Répondre par email</button>
    </div>
  `;

  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
}

async function loadClientRequests() {
  const list = document.querySelector("#clientRequestList");
  if (list) {
    list.innerHTML = `<article class="empty-state"><h3>Chargement...</h3><p>Lecture des demandes client.</p></article>`;
  }

  try {
    const response = await fetch("/api/client-actions");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      clientRequestsConfigured = payload.configured === false ? false : clientRequestsConfigured;
      clientRequests = [];
      renderClientRequests();
      return;
    }
    clientRequestsConfigured = payload.configured !== false;
    clientRequests = Array.isArray(payload.requests) ? payload.requests : [];
    renderClientRequests();
  } catch (error) {
    clientRequestsConfigured = false;
    clientRequests = [];
    renderClientRequests();
  }
}

async function markClientRequestDone(id) {
  return updateClientRequestStatus(id, "traité", "Demande client traitée");
}

async function updateClientRequestStatus(id, status, successMessage = "Demande client mise à jour") {
  try {
    const shouldRefreshDrawer = document.querySelector("#drawer")?.classList.contains("open");
    const response = await fetch("/api/client-actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    if (!response.ok) throw new Error("Mise à jour impossible");
    await loadClientRequests();
    if (shouldRefreshDrawer && getClientRequest(id)) openClientRequest(id);
    toast(successMessage);
  } catch (error) {
    toast(error.message);
  }
}

function renderAgentFilter() {
  const select = document.querySelector("#agentFilter");
  select.innerHTML = `<option value="all">Tous les agents</option>` +
    agents.map((agent) => `<option value="${agent.name}">${agent.name}</option>`).join("");
}

function renderTable() {
  const rows = getFilteredCases();
  document.querySelector("#caseTable").innerHTML = rows.map((item) => {
    const settled = remainingAmount(item) <= 0 || item.status === "Clôturé";
    return `
    <tr class="${item.archived ? "archived-row" : ""}">
      <td data-label="Dossier"><strong>${item.id}</strong><small>${item.nextDate}</small></td>
      <td data-label="Débiteur"><strong>${item.client}</strong><small>${item.contact} - ${item.phone}</small><small>${item.email}</small></td>
      <td class="amount" data-label="Montant">${formatMoney(remainingAmount(item))}</td>
      <td data-label="Retard">${item.delay} jours</td>
      <td data-label="Risque"><span class="badge ${item.risk}">${riskLabel(item.risk)}</span></td>
      <td data-label="Agent">${item.agent}</td>
      <td data-label="Statut"><span class="badge ${item.archived ? "archived" : statusClass(item)}">${item.archived ? "Archivé" : item.status}</span></td>
      <td data-label="Action">
        <div class="mini-actions">
          <button type="button" title="Ouvrir" data-open="${item.id}">O</button>
          <button type="button" title="Modifier" data-edit="${item.id}">M</button>
          <button type="button" title="${settled || item.archived ? "Action indisponible" : "Relancer"}" ${settled || item.archived ? "disabled" : `data-reminder-form="${item.id}"`}>R</button>
          <button type="button" title="${settled || item.archived ? "Action indisponible" : "Paiement"}" ${settled || item.archived ? "disabled" : `data-payment-form="${item.id}"`}>P</button>
        </div>
      </td>
    </tr>
  `;
  }).join("") || `
    <tr><td colspan="8">Aucun dossier ne correspond aux critères.</td></tr>
  `;
}

function renderRelances() {
  document.querySelector("#automationTimeline").innerHTML = steps.map(([day, title, desc], index) => `
    <article class="timeline-step">
      <span class="step-index">${index + 1}</span>
      <div>
        <div class="meta-row"><span class="badge neutral">${day}</span></div>
        <h3>${title}</h3>
        <p>${desc}</p>
        <button class="secondary-button compact-button" type="button" data-scenario="${index}">Appliquer</button>
      </div>
    </article>
  `).join("");

  document.querySelector("#taskList").innerHTML = cases
    .slice()
    .filter((item) => !item.archived && remainingAmount(item) > 0 && item.status !== "Clôturé")
    .sort((a, b) => b.delay - a.delay)
    .slice(0, 5)
    .map((item) => `
      <article class="task-card">
        <div class="meta-row">
          <span class="badge ${item.risk}">${riskLabel(item.risk)}</span>
          <span class="badge neutral">${item.nextDate}</span>
        </div>
        <h3>${item.nextAction}</h3>
        <p>${item.client} - ${formatMoney(remainingAmount(item))}</p>
        <div class="inline-actions">
          <button class="primary-button" type="button" data-reminder-form="${item.id}" data-channel="call">Planifier</button>
          <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="sms">SMS</button>
          <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="email">Email</button>
        </div>
      </article>
    `).join("") || `<article class="task-card"><h3>Aucune relance active</h3><p>Tous les dossiers affichés sont soldés ou sans action urgente.</p></article>`;
}

function renderPayments() {
  document.querySelector("#paymentGrid").innerHTML = cases
    .slice()
    .filter((item) => !item.archived)
    .sort((a, b) => remainingAmount(b) - remainingAmount(a))
    .map((item) => {
      const settled = remainingAmount(item) <= 0 || item.status === "Clôturé";
      return `
      <article class="payment-card">
        <div class="meta-row">
          <span class="badge ${settled ? "low" : item.promise ? "promise" : "neutral"}">${settled ? "Soldé" : item.promise ? "Promesse" : "Paiement"}</span>
          <span class="badge neutral">${item.id}</span>
        </div>
        <h3>${item.client}</h3>
        <strong>${formatMoney(remainingAmount(item))}</strong>
        <p>${settled ? "Dossier clôturé" : item.promise ? item.promise : "Aucun engagement actif"}</p>
        <div class="money-progress" aria-hidden="true">
          <span style="width:${Math.round((item.paid / Math.max(item.amount, 1)) * 100)}%"></span>
        </div>
        <div class="inline-actions">
          <button class="primary-button" type="button" ${settled ? "disabled" : `data-payment-form="${item.id}"`}>${settled ? "Soldé" : "Encaisser"}</button>
          <button class="secondary-button" type="button" ${settled ? "disabled" : `data-payment-full="${item.id}"`}>Encaisser tout</button>
          <button class="secondary-button" type="button" ${settled ? "disabled" : `data-promise-form="${item.id}"`}>Engagement</button>
        </div>
      </article>
    `;
    }).join("");
}

function renderReports() {
  const activeCases = cases.filter((item) => !item.archived);
  const due = activeCases.reduce((sum, item) => sum + item.amount - item.paid, 0);
  const recovered = activeCases.reduce((sum, item) => sum + item.paid, 0);
  const avgDelay = activeCases.length ? Math.round(activeCases.reduce((sum, item) => sum + item.delay, 0) / activeCases.length) : 0;

  const report = [
    ["Créances suivies", formatMoney(due)],
    ["Encaissements cumulés", formatMoney(recovered)],
    ["Retard moyen", `${avgDelay} jours`],
    ["Dossiers précontentieux", activeCases.filter((item) => item.risk === "legal").length],
    ["Promesses actives", activeCases.filter((item) => item.promise).length],
    ["Dossiers archivés", cases.filter((item) => item.archived).length]
  ];

  document.querySelector("#reportList").innerHTML = report.map(([label, value]) => `
    <div><dt>${label}</dt><dd>${value}</dd></div>
  `).join("");

  document.querySelector("#agentList").innerHTML = agents.map((agent) => {
    const rate = Math.round((agent.recovered / agent.target) * 100);
    return `
      <article class="agent-row">
        <div>
          <strong>${agent.name}</strong>
          <div class="channel-meter"><span style="width:${rate}%"></span></div>
          <small>${agent.cases} dossiers actifs</small>
        </div>
        <span class="badge neutral">${rate}%</span>
      </article>
    `;
  }).join("");
}

function renderClients() {
  const grid = document.querySelector("#clientGrid");
  if (!grid) return;
  syncClientsFromRecords();
  grid.innerHTML = clients.map((client) => {
    const clientCases = cases.filter((item) => item.client.toLowerCase() === client.name.toLowerCase());
    const due = clientCases.reduce((sum, item) => sum + remainingAmount(item), 0);
    const active = clientCases.filter((item) => !item.archived && remainingAmount(item) > 0).length;
    return `
      <article class="client-card">
        <div class="client-card-main">
          <div>
            <span class="badge neutral">${escapeHtml(client.segment || "Client")}</span>
            <h3>${escapeHtml(client.name)}</h3>
            <p>${escapeHtml(client.contact || "Service administratif")}<br><span class="muted-line">${escapeHtml(client.phone || "Téléphone non renseigné")}</span></p>
          </div>
          <strong>${formatMoney(due)}</strong>
        </div>
        <div class="client-card-foot">
          <span>${active} dossier(s) actif(s)</span>
          <span>${escapeHtml(client.email || "Email non renseigné")}</span>
        </div>
        <div class="inline-actions">
          <button class="primary-button" type="button" data-client-open="${escapeHtml(client.id)}">Détails</button>
          <button class="secondary-button" type="button" data-client-edit="${escapeHtml(client.id)}">Modifier</button>
          <button class="secondary-button" type="button" data-client-letter="${escapeHtml(client.name)}">Lettre</button>
        </div>
      </article>
    `;
  }).join("") || `<article class="client-card"><h3>Aucun client</h3><p>Ajoute un client ou importe une commande pour alimenter le portefeuille.</p></article>`;
}

function renderAgentsAdmin() {
  const list = document.querySelector("#agentAdminList");
  if (!list) return;
  list.innerHTML = agents.map((agent) => {
    const assignedCases = cases.filter((item) => item.agent === agent.name && !item.archived);
    const due = assignedCases.reduce((sum, item) => sum + remainingAmount(item), 0);
    const recovered = assignedCases.reduce((sum, item) => sum + item.paid, 0);
    const target = Math.max(agent.target, 1);
    const rate = Math.min(100, Math.round((Math.max(agent.recovered, recovered) / target) * 100));
    return `
      <article class="agent-admin-row ${agent.active ? "" : "inactive-row"}">
        <div>
          <div class="meta-row">
            <span class="badge ${agent.active ? "low" : "archived"}">${agent.active ? "Actif" : "Inactif"}</span>
            <span class="badge neutral">${escapeHtml(agent.role || "Agent")}</span>
          </div>
          <h3>${escapeHtml(agent.name)}</h3>
          <p>${escapeHtml(agent.email || "Email non renseigné")} - ${escapeHtml(agent.phone || "Téléphone non renseigné")}</p>
          <div class="channel-meter"><span style="width:${rate}%"></span></div>
        </div>
        <div class="agent-admin-stats">
          <strong>${formatMoney(due)}</strong>
          <span>${assignedCases.length} dossier(s)</span>
        </div>
        <div class="inline-actions">
          <button class="primary-button" type="button" data-agent-edit="${escapeHtml(agent.id)}">Modifier</button>
          <button class="secondary-button" type="button" data-agent-toggle="${escapeHtml(agent.id)}">${agent.active ? "Désactiver" : "Réactiver"}</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderLetters() {
  const caseSelect = document.querySelector("#letterCaseSelect");
  const list = document.querySelector("#letterList");
  if (!list) return;
  if (caseSelect) {
    const activeCases = cases.filter((item) => !item.archived && remainingAmount(item) > 0);
    caseSelect.innerHTML = activeCases.map((item) => `
      <option value="${escapeHtml(item.id)}">${escapeHtml(item.id)} - ${escapeHtml(item.client)} (${formatMoney(remainingAmount(item))})</option>
    `).join("");
  }
  list.innerHTML = letters.map((letter) => `
    <article class="letter-row">
      <div>
        <div class="meta-row">
          <span class="badge neutral">${escapeHtml(letter.type)}</span>
          <span class="badge promise">${escapeHtml(letter.status)}</span>
        </div>
        <h3>${escapeHtml(letter.subject)}</h3>
        <p>${escapeHtml(letter.client)} - ${new Date(letter.createdAt).toLocaleDateString("fr-FR")}</p>
      </div>
      <div class="inline-actions">
        <button class="primary-button" type="button" data-letter-open="${escapeHtml(letter.id)}">Ouvrir</button>
        <button class="secondary-button" type="button" data-letter-print="${escapeHtml(letter.id)}">Imprimer</button>
      </div>
    </article>
  `).join("") || `
    <article class="empty-state">
      <h3>Aucune lettre générée</h3>
      <p>Choisis un dossier actif pour préparer une relance formelle.</p>
    </article>
  `;
}

function clientOptions() {
  return [...new Set([...clients.map((item) => item.name), ...cases.map((item) => item.client), ...orders.map((item) => item.client)].filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr"));
}

function getOrdersForCase(item) {
  return orders.filter((order) => order.caseId === item.id || (!order.caseId && order.client.toLowerCase() === item.client.toLowerCase()));
}

function clientPortalUrl(caseId) {
  return `${window.location.origin}/client?dossier=${encodeURIComponent(caseId)}`;
}

async function copyClientPortalLink(caseId) {
  const item = getCase(caseId);
  if (!item) return;
  const url = clientPortalUrl(caseId);
  try {
    await navigator.clipboard.writeText(url);
    toast(`Lien client copié pour ${item.client}`);
  } catch (error) {
    window.prompt("Copie ce lien client", url);
  }
}

async function emailClientPortalLink(caseId) {
  const item = getCase(caseId);
  if (!item) return;
  if (!item.email) {
    toast("Email client indisponible");
    return;
  }
  const subject = `Votre espace recouvrement KFN Pharma - ${item.id}`;
  const body = [
    `Bonjour ${item.contact},`,
    "",
    `Vous pouvez consulter votre dossier de recouvrement ${item.id} via ce lien sécurisé :`,
    clientPortalUrl(caseId),
    "",
    "Cordialement,",
    "Administration de recouvrement KFN Pharma"
  ].join("\n");
  try {
    await sendEmailViaResend({ to: item.email, subject, text: body });
    addHistory(item, `Lien client envoyé par email le ${todayLabel()}`);
    saveCases();
    refreshViews();
    toast(`Lien client envoyé à ${item.client}`);
  } catch (error) {
    console.warn(error);
    openMailto(item.email, subject, body);
    toast("Resend indisponible : email préparé dans la messagerie");
  }
}

function orderGroupKey(order) {
  return String(order.client || "").trim().toLowerCase();
}

function getOrderGroup(order) {
  const key = orderGroupKey(order);
  return orders.filter((item) => orderGroupKey(item) === key);
}

function syncOrderCase(order) {
  const group = getOrderGroup(order);
  const groupOrders = group.length ? group : [order];
  const unpaidOrders = groupOrders.filter((item) => item.status !== "Payée");
  const total = unpaidOrders.reduce((sum, item) => sum + item.total, 0);
  const existingCaseId = groupOrders.find((item) => item.caseId)?.caseId || "";
  const existingCase = existingCaseId ? getCase(existingCaseId) : null;
  const label = `facture ${order.client}`;

  if (!unpaidOrders.length || total <= 0) {
    if (existingCase) {
      existingCase.paid = existingCase.amount;
      existingCase.status = "Clôturé";
      existingCase.risk = "low";
      existingCase.promise = "";
      existingCase.nextAction = "Commande payée";
      existingCase.nextDate = "Aucune";
      addHistory(existingCase, `Commande ${label} marquée payée le ${todayLabel()}`);
      groupOrders.forEach((item) => { item.caseId = existingCase.id; });
    }
    return;
  }

  const partial = groupOrders.some((item) => item.status === "Partiellement payée");
  if (existingCase) {
    existingCase.amount = total;
    existingCase.status = partial ? "Négociation" : "Nouveau";
    existingCase.risk = partial ? "medium" : "high";
    existingCase.nextAction = "Suivi facture client importée";
    existingCase.nextDate = "Dans 48h";
    addHistory(existingCase, `Facture client mise à jour : ${unpaidOrders.length} produit(s), total ${formatMoney(total)}`);
    groupOrders.forEach((item) => { item.caseId = existingCase.id; });
    return;
  }

  const knownClient = cases.find((item) => item.client.toLowerCase() === order.client.toLowerCase());
  const newCase = {
    id: nextCaseId(),
    client: order.client,
    contact: knownClient?.contact || "Service administratif",
    phone: knownClient?.phone || "+225 00 00 00 00 00",
    email: knownClient?.email || defaultEmail(order),
    amount: total,
    paid: 0,
    delay: 0,
    risk: partial ? "medium" : "high",
    archived: false,
    agent: knownClient?.agent || agents[0].name,
    status: partial ? "Négociation" : "Nouveau",
    nextAction: "Relance facture client importée",
    nextDate: "Aujourd'hui",
    promise: "",
    history: [
      `Dossier généré depuis l'import Excel du client`,
      `${unpaidOrders.length} produit(s) - total ${formatMoney(total)}`,
      ...unpaidOrders.slice(0, 4).map((item) => `${item.product} - ${item.quantity} ${item.packaging} x ${formatMoney(item.unitPrice)}`)
    ]
  };
  cases.unshift(newCase);
  groupOrders.forEach((item) => { item.caseId = newCase.id; });
}

function ensureOrderCases() {
  let changed = false;
  orders.forEach((order) => {
    if (order.status !== "Payée" && !order.caseId) {
      syncOrderCase(order);
      changed = true;
    }
  });
  if (changed) {
    saveOrders();
    saveCases();
  }
}

function renderOrders() {
  const clientList = document.querySelector("#clientList");
  const exportClient = document.querySelector("#orderExportClient");
  const orderTable = document.querySelector("#orderTable");
  const orderSummary = document.querySelector("#orderSummary");
  if (!clientList || !orderTable || !orderSummary) return;

  const clients = clientOptions();
  clientList.innerHTML = clients.map((client) => `<option value="${escapeHtml(client)}"></option>`).join("");
  if (exportClient) {
    const current = exportClient.value || "all";
    exportClient.innerHTML = `<option value="all">Tous les clients</option>` +
      clients.map((client) => `<option value="${escapeHtml(client)}">${escapeHtml(client)}</option>`).join("");
    exportClient.value = clients.includes(current) ? current : "all";
  }
  const unpaidTotal = orders.filter((item) => item.status !== "Payée").reduce((sum, item) => sum + item.total, 0);
  const paidTotal = orders.filter((item) => item.status === "Payée").reduce((sum, item) => sum + item.total, 0);
  const linkedCases = new Set(orders.filter((item) => item.caseId).map((item) => item.caseId)).size;
  const summary = [
    ["Commandes", orders.length],
    ["Impayés commandes", formatMoney(unpaidTotal)],
    ["Payées", formatMoney(paidTotal)],
    ["Dossiers générés", linkedCases]
  ];

  orderSummary.innerHTML = summary.map(([label, value]) => `
    <article class="mini-kpi">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");

  orderTable.innerHTML = orders.map((item) => `
    <tr>
      <td data-label="Commande"><strong>${escapeHtml(item.orderRef || item.id)}</strong><small>Ligne ${escapeHtml(item.id)} - ${escapeHtml(item.date)}</small></td>
      <td data-label="Client"><strong>${escapeHtml(item.client)}</strong>${item.caseId ? `<small>Dossier ${escapeHtml(item.caseId)}</small>` : "<small>Aucun dossier lié</small>"}</td>
      <td data-label="Produit"><strong>${escapeHtml(item.product)}</strong></td>
      <td data-label="Conditionnement"><strong>${item.quantity} ${escapeHtml(item.packaging)}</strong><small>${formatMoney(item.unitPrice)} / ${escapeHtml(item.packaging.toLowerCase())}</small></td>
      <td class="amount" data-label="Total">${formatMoney(item.total)}</td>
      <td data-label="Statut"><span class="badge ${orderStatusClass(item.status)}">${escapeHtml(item.status)}</span></td>
      <td data-label="Action">
        <div class="mini-actions">
          <button type="button" title="Générer dossier" ${item.status === "Payée" ? "disabled" : `data-generate-case="${escapeHtml(item.id)}"`}>G</button>
          <button type="button" title="Ouvrir dossier" ${item.caseId ? `data-open="${escapeHtml(item.caseId)}"` : "disabled"}>O</button>
          <button type="button" title="Supprimer" data-delete-order="${escapeHtml(item.id)}">X</button>
        </div>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7">Aucune commande enregistrée.</td></tr>`;
}

function renderOrderSheet() {
  const body = document.querySelector("#orderSheetBody");
  if (!body) return;
  body.innerHTML = Array.from({ length: sheetRows }, (_, index) => `
    <tr>
      <td data-label="Référence"><input data-sheet-field="orderRef" placeholder="BC-2026-${String(index + 1).padStart(3, "0")}" /></td>
      <td data-label="Client"><input data-sheet-field="client" list="clientList" placeholder="Client" /></td>
      <td data-label="Produit"><input data-sheet-field="product" placeholder="Produit commandé" /></td>
      <td data-label="Conditionnement">
        <select data-sheet-field="packaging">
          ${orderPackagingOptions.map((item) => `<option>${item}</option>`).join("")}
        </select>
      </td>
      <td data-label="Quantité"><input data-sheet-field="quantity" type="number" min="1" step="1" value="1" /></td>
      <td data-label="Prix unitaire"><input data-sheet-field="unitPrice" type="number" min="0" step="1000" placeholder="0" /></td>
      <td data-label="Date"><input data-sheet-field="date" type="date" value="${todayInputValue()}" /></td>
      <td data-label="Statut">
        <select data-sheet-field="status">
          ${orderStatuses.map((status) => `<option>${status}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("");
}

function downloadHtmlExcel(html, filename) {
  const blob = new Blob([`\ufeff${html}`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportOrdersExcel(rows = orders, title = "Commandes Recouvria", filename = "") {
  const safeRows = rows.slice();
  const total = safeRows.reduce((sum, item) => sum + item.total, 0);
  const unpaid = safeRows.filter((item) => item.status !== "Payée").reduce((sum, item) => sum + item.total, 0);
  const generatedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date());
  const tableRows = safeRows.map((item) => `
    <tr>
      <td>${escapeHtml(item.orderRef || item.id)}</td>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.client)}</td>
      <td>${escapeHtml(item.product)}</td>
      <td>${escapeHtml(item.packaging)}</td>
      <td>${item.quantity}</td>
      <td>${item.unitPrice}</td>
      <td>${item.total}</td>
      <td>${escapeHtml(item.date)}</td>
      <td>${escapeHtml(item.status)}</td>
      <td>${escapeHtml(item.caseId || "")}</td>
    </tr>
  `).join("");
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #1f2428; }
          h1 { margin-bottom: 4px; }
          .meta { color: #657079; margin-bottom: 18px; }
          .summary { margin-bottom: 18px; border-collapse: collapse; }
          .summary td { padding: 8px 14px; border: 1px solid #dfe4e7; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #007a72; color: #ffffff; }
          th, td { border: 1px solid #dfe4e7; padding: 8px; text-align: left; }
          td:nth-child(6), td:nth-child(7), td:nth-child(8) { text-align: right; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Généré le ${escapeHtml(generatedAt)} - ${safeRows.length} ligne(s)</p>
        <table class="summary">
          <tr>
            <td>Total commandes : ${formatMoney(total)}</td>
            <td>Total à recouvrer : ${formatMoney(unpaid)}</td>
          </tr>
        </table>
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Ligne</th>
              <th>Client</th>
              <th>Produit</th>
              <th>Conditionnement</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Dossier</th>
            </tr>
          </thead>
          <tbody>${tableRows || `<tr><td colspan="11">Aucune commande à exporter.</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `;
  const exportName = filename || `recouvria-commandes-${new Date().toISOString().slice(0, 10)}.xls`;
  downloadHtmlExcel(html, exportName);
  toast("Export Excel des commandes généré");
}

function exportCaseOrdersExcel(id) {
  const item = getCase(id);
  if (!item) return;
  const rows = getOrdersForCase(item);
  if (!rows.length) {
    toast("Aucune commande liée à ce dossier");
    return;
  }
  const slug = normalizeHeader(item.client).slice(0, 28) || "client";
  exportOrdersExcel(rows, `Commandes - ${item.client}`, `recouvria-commandes-${slug}-${new Date().toISOString().slice(0, 10)}.xls`);
}

function exportSelectedOrdersExcel() {
  const client = document.querySelector("#orderExportClient")?.value || "all";
  const rows = client === "all" ? orders : orders.filter((item) => item.client === client);
  if (!rows.length) {
    toast("Aucune commande pour ce client");
    return;
  }
  const slug = client === "all" ? "tous-clients" : normalizeHeader(client).slice(0, 28);
  const title = client === "all" ? "Commandes Recouvria - tous les clients" : `Commandes - ${client}`;
  exportOrdersExcel(rows, title, `recouvria-commandes-${slug}-${new Date().toISOString().slice(0, 10)}.xls`);
}

function toggleOrderSheet() {
  const panel = document.querySelector("#orderSheetPanel");
  if (!panel) return;
  panel.hidden = false;
  if (!document.querySelector("#orderSheetBody")?.children.length) renderOrderSheet();
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function addOrderSheetRow() {
  sheetRows += 1;
  renderOrderSheet();
}

function saveOrderSheet() {
  const rows = [...document.querySelectorAll("#orderSheetBody tr")];
  let saved = 0;
  rows.forEach((row) => {
    const value = (field) => row.querySelector(`[data-sheet-field="${field}"]`)?.value?.trim() || "";
    const quantity = Math.max(0, Number(value("quantity")) || 0);
    const unitPrice = parseAmount(value("unitPrice"));
    const order = {
      id: nextOrderId(),
      orderRef: value("orderRef") || `BC-${todayInputValue().replaceAll("-", "")}-${saved + 1}`,
      client: value("client"),
      product: value("product"),
      packaging: normalizePackaging(value("packaging")),
      quantity,
      unitPrice,
      total: quantity * unitPrice,
      date: value("date") || todayInputValue(),
      status: value("status") || "Non payée",
      caseId: ""
    };
    if (!order.client || !order.product || order.total <= 0) return;
    orders.unshift(order);
    syncOrderCase(order);
    saved += 1;
  });

  if (!saved) {
    toast("Aucune ligne valide à enregistrer");
    return;
  }

  saveOrders();
  saveCases();
  refreshViews();
  renderOrderSheet();
  toast(`${saved} ligne(s) enregistrée(s) et totalisée(s) dans le portefeuille`);
}

function openDrawer(id) {
  const item = cases.find((entry) => entry.id === id);
  if (!item) return;
  const due = remainingAmount(item);
  const settled = due <= 0 || item.status === "Clôturé";
  const linkedOrders = getOrdersForCase(item);
  const orderPanel = linkedOrders.length
    ? `
      <section class="linked-orders">
        <p class="eyebrow">Produits commandés</p>
        ${linkedOrders.map((order) => `
          <article>
            <div>
              <strong>${escapeHtml(order.product)}</strong>
              <span>${escapeHtml(order.orderRef || order.id)} - ${order.quantity} ${escapeHtml(order.packaging)} x ${formatMoney(order.unitPrice)}</span>
            </div>
            <div>
              <strong>${formatMoney(order.total)}</strong>
              <span class="badge ${orderStatusClass(order.status)}">${escapeHtml(order.status)}</span>
            </div>
          </article>
        `).join("")}
      </section>
    `
    : "";
  const actionPanel = item.archived
    ? `
      <button class="primary-button" type="button" data-edit="${item.id}">Modifier le dossier</button>
      <button class="primary-button" type="button" data-client-link="${item.id}">Copier lien client</button>
      <button class="secondary-button" type="button" data-client-link-email="${item.id}">Envoyer lien client</button>
      <button class="secondary-button" type="button" data-print-case="${item.id}">Imprimer PDF</button>
      <button class="secondary-button" type="button" data-generate-letter="${item.id}">Générer lettre</button>
      ${linkedOrders.length ? `<button class="secondary-button" type="button" data-export-case-orders="${item.id}">Exporter commandes</button>` : ""}
      <button class="secondary-button" type="button" data-restore-case="${item.id}">Réactiver</button>
      <button class="danger-button" type="button" data-delete-case="${item.id}">Supprimer</button>
      <button class="secondary-button" type="button" disabled>Dossier archivé</button>
    `
    : settled
      ? `
      <button class="primary-button" type="button" data-edit="${item.id}">Modifier le dossier</button>
      <button class="primary-button" type="button" data-client-link="${item.id}">Copier lien client</button>
      <button class="secondary-button" type="button" data-client-link-email="${item.id}">Envoyer lien client</button>
      <button class="secondary-button" type="button" data-print-case="${item.id}">Imprimer PDF</button>
      <button class="secondary-button" type="button" data-generate-letter="${item.id}">Générer lettre</button>
      ${linkedOrders.length ? `<button class="secondary-button" type="button" data-export-case-orders="${item.id}">Exporter commandes</button>` : ""}
      <button class="secondary-button" type="button" data-archive-case="${item.id}">Archiver</button>
      <button class="danger-button" type="button" data-delete-case="${item.id}">Supprimer</button>
      <button class="secondary-button" type="button" disabled>Paiement soldé</button>
      <button class="secondary-button" type="button" disabled>Relances désactivées</button>
      <button class="secondary-button" type="button" disabled>Aucun engagement requis</button>
    `
      : `
      <button class="primary-button" type="button" data-edit="${item.id}">Modifier le dossier</button>
      <button class="primary-button" type="button" data-client-link="${item.id}">Copier lien client</button>
      <button class="secondary-button" type="button" data-client-link-email="${item.id}">Envoyer lien client</button>
      <button class="secondary-button" type="button" data-print-case="${item.id}">Imprimer PDF</button>
      <button class="secondary-button" type="button" data-generate-letter="${item.id}">Générer lettre</button>
      ${linkedOrders.length ? `<button class="secondary-button" type="button" data-export-case-orders="${item.id}">Exporter commandes</button>` : ""}
      <button class="primary-button" type="button" data-payment-form="${item.id}">Encaisser paiement</button>
      <button class="secondary-button" type="button" data-payment-full="${item.id}">Encaisser tout</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="call">Appeler</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="sms">Envoyer SMS</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="email">Email</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="notice">Mise en demeure</button>
      <button class="secondary-button" type="button" data-promise-form="${item.id}">Engagement</button>
      <button class="secondary-button" type="button" data-archive-case="${item.id}">Archiver</button>
      <button class="danger-button" type="button" data-delete-case="${item.id}">Supprimer</button>
    `;

  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${item.id}</p>
      <h2>${item.client}</h2>
      <p>${item.contact} - ${item.phone}<br><span class="muted-line">${item.email}</span></p>
      <div class="meta-row">
        <span class="badge ${item.risk}">${riskLabel(item.risk)}</span>
        <span class="badge ${item.archived ? "archived" : statusClass(item)}">${item.archived ? "Archivé" : item.status}</span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-stat"><span>Montant initial</span><strong>${formatMoney(item.amount)}</strong></div>
      <div class="detail-stat"><span>Reste dû</span><strong>${formatMoney(due)}</strong></div>
      <div class="detail-stat"><span>Retard</span><strong>${item.delay} jours</strong></div>
      <div class="detail-stat"><span>Agent</span><strong>${item.agent}</strong></div>
      <div class="detail-stat"><span>Téléphone</span><strong>${item.phone}</strong></div>
      <div class="detail-stat"><span>Email</span><strong>${item.email}</strong></div>
    </div>

    ${item.archived ? `<div class="settled-note archive-note"><strong>Dossier archivé</strong><span>Ce dossier est conservé dans l'historique. Réactive-le si tu veux reprendre les relances ou les paiements.</span></div>` : ""}
    ${!item.archived && settled ? `<div class="settled-note"><strong>Dossier soldé</strong><span>Les actions de paiement et de relance sont désactivées tant qu'il n'y a plus de montant à recouvrer.</span></div>` : ""}

    <section>
      <p class="eyebrow">Prochaine action</p>
      <h3>${item.nextAction}</h3>
      <p>${item.nextDate}</p>
      ${item.promise ? `<p><strong>Engagement :</strong> ${item.promise}</p>` : ""}
    </section>

    ${orderPanel}

    <div class="drawer-actions">
      ${actionPanel}
    </div>

    <div class="activity-log">
      <p class="eyebrow">Historique</p>
      ${item.history.map((line, index) => `
        <div><strong>${line}</strong><span>${index + 1} jour(s) avant</span></div>
      `).join("")}
    </div>
  `;

  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
}

function openReminderForm(id, channel = "call") {
  const item = getCase(id);
  if (!item) return;
  if (item.archived) {
    openDrawer(id);
    toast("Ce dossier est archivé : réactive-le avant une relance");
    return;
  }
  if (remainingAmount(item) <= 0 || item.status === "Clôturé") {
    openDrawer(id);
    toast("Ce dossier est soldé : relance désactivée");
    return;
  }

  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${escapeHtml(item.id)}</p>
      <h2>Effectuer une relance</h2>
      <p>${escapeHtml(item.client)} - reste dû ${formatMoney(remainingAmount(item))}</p>
    </div>

    <div class="case-form" id="reminderForm" data-case-id="${escapeHtml(item.id)}">
      <label>
        <span>Canal</span>
        <select name="channel">
          ${reminderChannels.map(([value, label]) => `<option value="${value}" ${value === channel ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Prochaine échéance</span>
        <input name="nextDate" value="${escapeHtml(item.nextDate || "Dans 48h")}" required />
      </label>
      <label class="full">
        <span>Prochaine action</span>
        <input name="nextAction" value="${escapeHtml(item.nextAction || "Suivi de relance")}" required />
      </label>
      <label class="full">
        <span>Compte rendu</span>
        <textarea name="note" rows="4" placeholder="Ex : Client joint, promesse attendue vendredi."></textarea>
      </label>
      <div class="form-actions">
        <button class="primary-button" type="button" data-save-form="reminderForm">Enregistrer relance</button>
        <button class="secondary-button" type="button" data-open="${escapeHtml(item.id)}">Annuler</button>
      </div>
    </div>
  `;

  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
  bindFormButton("reminderForm");
}

function openPaymentForm(id) {
  const item = getCase(id);
  if (!item) return;
  const remaining = remainingAmount(item);
  if (item.archived) {
    openDrawer(id);
    toast("Ce dossier est archivé : réactive-le avant encaissement");
    return;
  }
  if (remaining <= 0 || item.status === "Clôturé") {
    openDrawer(id);
    toast("Ce dossier est déjà soldé");
    return;
  }

  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${escapeHtml(item.id)}</p>
      <h2>Encaisser un paiement</h2>
      <p>${escapeHtml(item.client)} - reste dû ${formatMoney(remaining)}</p>
    </div>

    <div class="case-form" id="paymentForm" data-case-id="${escapeHtml(item.id)}">
      <label>
        <span>Montant encaissé</span>
        <input name="amount" type="number" min="1" max="${remaining}" step="1000" value="${remaining}" required />
      </label>
      <label>
        <span>Moyen de paiement</span>
        <select name="method">
          ${paymentMethods.map((method) => `<option value="${escapeHtml(method)}">${escapeHtml(method)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Date</span>
        <input name="date" value="${todayLabel()}" required />
      </label>
      <label>
        <span>Référence</span>
        <input name="reference" placeholder="Reçu, transaction, banque..." />
      </label>
      <label class="full">
        <span>Note</span>
        <textarea name="note" rows="3" placeholder="Détail utile pour la comptabilité ou le superviseur."></textarea>
      </label>
      <div class="form-actions">
        <button class="primary-button" type="button" data-save-form="paymentForm" ${remaining <= 0 ? "disabled" : ""}>Valider paiement</button>
        <button class="secondary-button" type="button" data-open="${escapeHtml(item.id)}">Annuler</button>
      </div>
    </div>
  `;

  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
  bindFormButton("paymentForm");
}

function openPromiseForm(id = "") {
  const item = getCase(id);
  const promiseCases = cases.filter((entry) => !entry.archived && remainingAmount(entry) > 0 && entry.status !== "Clôturé");
  if (item?.archived) {
    openDrawer(id);
    toast("Ce dossier est archivé : réactive-le avant un engagement");
    return;
  }
  if (item && (remainingAmount(item) <= 0 || item.status === "Clôturé")) {
    openDrawer(id);
    toast("Ce dossier est soldé : aucun engagement requis");
    return;
  }
  const selectedId = item?.id || promiseCases[0]?.id || "";
  if (!selectedId) {
    toast("Aucun dossier actif disponible pour un engagement");
    return;
  }

  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">Engagement</p>
      <h2>Plan de paiement</h2>
      <p>Enregistre une promesse et place le dossier en suivi de paiement.</p>
    </div>

    <div class="case-form" id="promiseForm" data-case-id="${item ? escapeHtml(selectedId) : ""}">
      <label class="full">
        <span>Dossier</span>
        <select name="caseId" ${item ? "disabled" : ""}>
          ${promiseCases.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === selectedId ? "selected" : ""}>${escapeHtml(entry.id)} - ${escapeHtml(entry.client)}</option>`).join("")}
        </select>
      </label>
      <label class="full">
        <span>Engagement</span>
        <textarea name="promise" rows="4" required placeholder="Ex : 1 500 000 FCFA le 31/05 puis solde le 15/06">${escapeHtml(item?.promise || `500 000 FCFA le ${todayLabel()}`)}</textarea>
      </label>
      <label>
        <span>Prochaine échéance</span>
        <input name="nextDate" value="${escapeHtml(item?.nextDate || "Dans 7 jours")}" required />
      </label>
      <label>
        <span>Prochaine action</span>
        <input name="nextAction" value="Vérifier engagement de paiement" required />
      </label>
      <div class="form-actions">
        <button class="primary-button" type="button" data-save-form="promiseForm">Sauvegarder engagement</button>
        <button class="secondary-button" type="button" ${item ? `data-open="${escapeHtml(item.id)}"` : "data-close-form"}>Annuler</button>
      </div>
    </div>
  `;

  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
  bindFormButton("promiseForm");
}

async function registerReminder(id, channel, note = "", nextAction = "Suivi de relance", nextDate = "Dans 48h") {
  const item = getCase(id);
  if (!item) return;
  if (item.archived) {
    openDrawer(id);
    toast("Ce dossier est archivé : relance non disponible");
    return;
  }
  if (remainingAmount(item) <= 0 || item.status === "Clôturé") {
    openDrawer(id);
    toast("Ce dossier est soldé : relance non nécessaire");
    return;
  }
  const label = channelLabel(channel);

  item.status = channel === "notice" ? "Précontentieux" : "Relancé";
  item.nextAction = nextAction;
  item.nextDate = nextDate;
  if (channel === "notice") item.risk = "legal";
  addHistory(item, `${label} effectué le ${todayLabel()}${note ? ` - ${note}` : ""}`);
  saveCases();
  refreshViews();
  openDrawer(id);
  if (channel === "email" && item.email) {
    try {
      await sendEmailViaResend({
        to: item.email,
        subject: reminderSubject(item),
        text: reminderMessage(item, note)
      });
      toast(`Email envoyé à ${item.client}`);
      return;
    } catch (error) {
      console.warn(error);
      openMailto(item.email, reminderSubject(item), reminderMessage(item, note));
      toast("Resend indisponible : email préparé dans la messagerie");
      return;
    }
  }
  const opened = openCommunicationLink(item, channel, note);
  toast(opened ? `${label} préparé pour ${item.client}` : `${label} enregistré pour ${item.client}`);
}

async function saveReminderFromForm(form) {
  await registerReminder(
    form.dataset.caseId,
    fieldValue(form, "channel"),
    fieldValue(form, "note").trim(),
    fieldValue(form, "nextAction").trim(),
    fieldValue(form, "nextDate").trim()
  );
}

function savePaymentFromForm(form) {
  const item = getCase(form.dataset.caseId);
  if (!item) return;
  if (item.archived) {
    openDrawer(item.id);
    toast("Ce dossier est archivé : paiement non disponible");
    return;
  }

  const amount = Math.max(0, Number(fieldValue(form, "amount")) || 0);
  const paidAmount = Math.min(amount, remainingAmount(item));
  if (paidAmount <= 0) {
    toast("Aucun montant à encaisser");
    return;
  }

  item.paid = Math.min(item.amount, item.paid + paidAmount);
  const method = fieldValue(form, "method");
  const reference = fieldValue(form, "reference").trim();
  const note = fieldValue(form, "note").trim();
  const suffix = [method, reference, note].filter(Boolean).join(" - ");
  addHistory(item, `Paiement encaissé ${formatMoney(paidAmount)} le ${fieldValue(form, "date").trim()}${suffix ? ` - ${suffix}` : ""}`);

  if (remainingAmount(item) === 0) {
    item.status = "Clôturé";
    item.risk = "low";
    item.promise = "";
    item.nextAction = "Dossier soldé";
    item.nextDate = "Aucune";
  } else {
    item.status = item.promise ? "Promesse" : "Négociation";
    item.nextAction = "Suivi paiement restant";
    item.nextDate = "Dans 48h";
  }

  saveCases();
  refreshViews();
  openDrawer(item.id);
  toast(`Paiement de ${formatMoney(paidAmount)} enregistré`);
}

function registerFullPayment(id) {
  const item = getCase(id);
  if (!item) return;
  if (item.archived) {
    openDrawer(id);
    toast("Ce dossier est archivé : paiement non disponible");
    return;
  }
  const amount = remainingAmount(item);
  if (amount <= 0) {
    toast("Dossier déjà soldé");
    return;
  }

  item.paid = item.amount;
  item.status = "Clôturé";
  item.risk = "low";
  item.promise = "";
  item.nextAction = "Dossier soldé";
  item.nextDate = "Aucune";
  addHistory(item, `Paiement total encaissé ${formatMoney(amount)} le ${todayLabel()}`);
  saveCases();
  refreshViews();
  openDrawer(item.id);
  toast(`Dossier soldé : ${item.client}`);
}

function savePromiseFromForm(form) {
  const id = form.dataset.caseId || fieldValue(form, "caseId");
  const item = getCase(id);
  if (!item) return;
  if (item.archived) {
    openDrawer(item.id);
    toast("Ce dossier est archivé : engagement non disponible");
    return;
  }

  item.promise = fieldValue(form, "promise").trim();
  item.nextDate = fieldValue(form, "nextDate").trim();
  item.nextAction = fieldValue(form, "nextAction").trim();
  item.status = "Promesse";
  addHistory(item, `Engagement de paiement enregistré le ${todayLabel()} - ${item.promise}`);
  saveCases();
  refreshViews();
  openDrawer(item.id);
  toast(`Engagement sauvegardé pour ${item.client}`);
}

function applyScenario(index) {
  const [day, title] = steps[index] || steps[0];
  const target = cases
    .filter((item) => !item.archived && remainingAmount(item) > 0 && item.status !== "Clôturé")
    .sort((a, b) => b.delay - a.delay)[0];
  if (!target) {
    toast("Aucun dossier actif à traiter");
    return;
  }

  target.nextAction = title;
  target.nextDate = day;
  addHistory(target, `Scénario ${title} appliqué le ${todayLabel()}`);
  saveCases();
  refreshViews();
  openDrawer(target.id);
  toast(`Scénario appliqué à ${target.client}`);
}

function exportCases() {
  const rows = getFilteredCases();
  const totalAmount = rows.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = rows.reduce((sum, item) => sum + item.paid, 0);
  const totalDue = rows.reduce((sum, item) => sum + remainingAmount(item), 0);
  const generatedAt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date());
  const tableRows = rows.map((item) => `
    <tr>
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.client)}</td>
      <td>${escapeHtml(item.contact)}</td>
      <td>${escapeHtml(item.phone)}</td>
      <td>${escapeHtml(item.email)}</td>
      <td>${item.amount}</td>
      <td>${item.paid}</td>
      <td>${remainingAmount(item)}</td>
      <td>${item.delay}</td>
      <td>${escapeHtml(riskLabel(item.risk))}</td>
      <td>${escapeHtml(item.agent)}</td>
      <td>${escapeHtml(item.archived ? "Archivé" : item.status)}</td>
      <td>${escapeHtml(item.promise || "")}</td>
      <td>${escapeHtml(item.nextAction)}</td>
      <td>${escapeHtml(item.nextDate)}</td>
    </tr>
  `).join("");
  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #1f2428; }
          h1 { margin-bottom: 4px; }
          .meta { color: #657079; margin-bottom: 18px; }
          .summary { margin-bottom: 18px; border-collapse: collapse; }
          .summary td { padding: 8px 14px; border: 1px solid #dfe4e7; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #007a72; color: #ffffff; }
          th, td { border: 1px solid #dfe4e7; padding: 8px; text-align: left; }
          td:nth-child(6), td:nth-child(7), td:nth-child(8), td:nth-child(9) { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Export portefeuille Recouvria</h1>
        <p class="meta">Généré le ${escapeHtml(generatedAt)} - ${rows.length} dossier(s)</p>
        <table class="summary">
          <tr>
            <td>Montant initial : ${formatMoney(totalAmount)}</td>
            <td>Payé : ${formatMoney(totalPaid)}</td>
            <td>Reste dû : ${formatMoney(totalDue)}</td>
          </tr>
        </table>
        <table>
          <thead>
            <tr>
              <th>Dossier</th>
              <th>Débiteur</th>
              <th>Contact</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Montant initial</th>
              <th>Payé</th>
              <th>Reste dû</th>
              <th>Retard</th>
              <th>Risque</th>
              <th>Agent</th>
              <th>Statut</th>
              <th>Promesse</th>
              <th>Prochaine action</th>
              <th>Prochaine échéance</th>
            </tr>
          </thead>
          <tbody>${tableRows || `<tr><td colspan="15">Aucun dossier exporté.</td></tr>`}</tbody>
        </table>
      </body>
    </html>
  `;
  const blob = new Blob([`\ufeff${html}`], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recouvria-portefeuille-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("Export Excel généré");
}

function printCasePdf(id) {
  const item = getCase(id);
  if (!item) return;
  const due = remainingAmount(item);
  const history = (item.history || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const linkedOrders = getOrdersForCase(item);
  const logoUrl = new URL("assets/kfn-pharma-recouvrement.png", window.location.href).href;
  const orderRows = linkedOrders.map((order) => `
    <tr>
      <td>${escapeHtml(order.orderRef || order.id)}</td>
      <td>${escapeHtml(order.product)}</td>
      <td>${escapeHtml(`${order.quantity} ${order.packaging}`)}</td>
      <td>${formatMoney(order.total)}</td>
      <td>${escapeHtml(order.status)}</td>
    </tr>
  `).join("");
  const printWindow = window.open("", "_blank", "width=900,height=720");
  if (!printWindow) {
    toast("Autorise les fenêtres contextuelles pour imprimer");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(item.id)} - Recouvria</title>
        <style>
          body { margin: 32px; font-family: "Segoe UI", Arial, sans-serif; color: #1f2428; }
          header { border-bottom: 3px solid #007a72; padding-bottom: 18px; margin-bottom: 22px; }
          .logo { display: block; width: 260px; max-width: 70%; height: auto; margin-bottom: 18px; }
          h1 { margin: 0; font-size: 28px; }
          h2 { margin: 22px 0 10px; font-size: 18px; color: #007a72; }
          .muted { color: #657079; }
          .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .box { border: 1px solid #dfe4e7; border-radius: 8px; padding: 12px; }
          .box span { display: block; color: #657079; font-size: 12px; margin-bottom: 5px; }
          .box strong { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #dfe4e7; padding: 9px; text-align: left; font-size: 13px; }
          th { background: #f2f7f6; color: #005f2f; }
          ul { padding-left: 18px; }
          @media print { body { margin: 18mm; } button { display: none; } }
        </style>
      </head>
      <body>
        <header>
          <img class="logo" src="${logoUrl}" alt="KFN Pharma - Service administratif de recouvrement" />
          <p class="muted">Fiche dossier client - Service administratif de recouvrement</p>
          <h1>${escapeHtml(item.client)}</h1>
          <p>${escapeHtml(item.id)} - ${escapeHtml(item.contact)} - ${escapeHtml(item.phone)} - ${escapeHtml(item.email)}</p>
        </header>
        <section class="grid">
          <div class="box"><span>Montant initial</span><strong>${formatMoney(item.amount)}</strong></div>
          <div class="box"><span>Payé</span><strong>${formatMoney(item.paid)}</strong></div>
          <div class="box"><span>Reste dû</span><strong>${formatMoney(due)}</strong></div>
          <div class="box"><span>Retard</span><strong>${item.delay} jours</strong></div>
          <div class="box"><span>Agent</span><strong>${escapeHtml(item.agent)}</strong></div>
          <div class="box"><span>Statut</span><strong>${escapeHtml(item.archived ? "Archivé" : item.status)}</strong></div>
        </section>
        <h2>Prochaine action</h2>
        <p><strong>${escapeHtml(item.nextAction)}</strong><br /><span class="muted">${escapeHtml(item.nextDate)}</span></p>
        ${item.promise ? `<h2>Engagement</h2><p>${escapeHtml(item.promise)}</p>` : ""}
        <h2>Produits / factures liés</h2>
        <table>
          <thead><tr><th>Référence</th><th>Désignation</th><th>Quantité</th><th>Montant</th><th>Statut</th></tr></thead>
          <tbody>${orderRows || `<tr><td colspan="5">Aucune commande liée.</td></tr>`}</tbody>
        </table>
        <h2>Historique</h2>
        <ul>${history || "<li>Aucun historique</li>"}</ul>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
  toast("Fiche prête pour impression PDF");
}

function archiveCase(id) {
  const item = getCase(id);
  if (!item) return;
  if (!window.confirm(`Archiver le dossier ${item.id} ?`)) return;
  item.archived = true;
  addHistory(item, `Dossier archivé le ${todayLabel()}`);
  saveCases();
  refreshViews();
  openDrawer(id);
  toast("Dossier archivé");
}

function restoreCase(id) {
  const item = getCase(id);
  if (!item) return;
  item.archived = false;
  addHistory(item, `Dossier réactivé le ${todayLabel()}`);
  saveCases();
  refreshViews();
  openDrawer(id);
  toast("Dossier réactivé");
}

function deleteCase(id) {
  const item = getCase(id);
  if (!item) return;
  if (!window.confirm(`Supprimer définitivement le dossier ${item.id} ?`)) return;
  cases = cases.filter((entry) => entry.id !== id);
  orders = orders.map((order) => order.caseId === id ? { ...order, caseId: "" } : order);
  saveCases();
  saveOrders();
  refreshViews();
  closeDrawer();
  toast("Dossier supprimé");
}

function letterContent(item, type = "Mise en demeure") {
  const due = formatMoney(remainingAmount(item));
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());
  const intro = type === "Relance amiable"
    ? "Sauf erreur ou omission de notre part, votre compte présente un solde impayé."
    : "Malgré nos précédentes relances, votre compte présente toujours un solde impayé.";
  return [
    `Abidjan, le ${today}`,
    "",
    `A l'attention de ${item.contact}`,
    `${item.client}`,
    "",
    `Objet : ${type} - dossier ${item.id}`,
    "",
    `Madame, Monsieur,`,
    "",
    `${intro} Le montant restant dû au titre du dossier ${item.id} s'élève à ${due}.`,
    "",
    item.promise ? `Nous notons l'engagement suivant : ${item.promise}.` : "Aucun engagement de paiement ferme n'est actuellement enregistré dans nos dossiers.",
    "",
    "Nous vous invitons à régulariser cette situation ou à prendre contact avec notre service recouvrement sous 48 heures afin de convenir d'un échéancier.",
    "",
    "A défaut de retour dans ce délai, le dossier pourra être transmis au service précontentieux conformément à nos procédures internes.",
    "",
    "Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.",
    "",
    `Service recouvrement - Recouvria`,
    `Agent en charge : ${item.agent}`
  ].join("\n");
}

function generateLetterForCase(id, type = "Mise en demeure") {
  const item = getCase(id);
  if (!item) return;
  const letter = {
    id: nextLetterId(),
    caseId: item.id,
    client: item.client,
    subject: `${type} - ${item.id}`,
    type,
    content: letterContent(item, type),
    status: "Brouillon",
    createdAt: new Date().toISOString()
  };
  letters.unshift(letter);
  addHistory(item, `${type} générée le ${todayLabel()}`);
  saveLetters();
  saveCases();
  refreshViews();
  switchView("lettres");
  openLetter(letter.id);
  toast("Lettre de relance générée");
}

function generateLetterForClient(name) {
  const target = cases
    .filter((item) => item.client.toLowerCase() === String(name).toLowerCase() && remainingAmount(item) > 0 && !item.archived)
    .sort((a, b) => remainingAmount(b) - remainingAmount(a))[0];
  if (!target) {
    toast("Aucun dossier actif pour ce client");
    return;
  }
  generateLetterForCase(target.id);
}

function getLetter(id) {
  return letters.find((item) => item.id === id);
}

function openLetter(id) {
  const letter = getLetter(id);
  if (!letter) return;
  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${escapeHtml(letter.id)}</p>
      <h2>${escapeHtml(letter.subject)}</h2>
      <p>${escapeHtml(letter.client)} - ${new Date(letter.createdAt).toLocaleDateString("fr-FR")}</p>
    </div>
    <div class="letter-preview">${escapeHtml(letter.content)}</div>
    <div class="drawer-actions">
      <button class="primary-button" type="button" data-letter-print="${escapeHtml(letter.id)}">Imprimer</button>
      <button class="secondary-button" type="button" data-letter-status="${escapeHtml(letter.id)}">Marquer envoyée</button>
      ${letter.caseId ? `<button class="secondary-button" type="button" data-open="${escapeHtml(letter.caseId)}">Voir dossier</button>` : ""}
    </div>
  `;
  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
}

function printLetter(id) {
  const letter = getLetter(id);
  if (!letter) return;
  const printWindow = window.open("", "_blank", "width=900,height=720");
  if (!printWindow) {
    toast("Autorise les fenêtres contextuelles pour imprimer");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(letter.subject)}</title>
        <style>
          body { margin: 28mm; font-family: "Segoe UI", Arial, sans-serif; color: #172226; line-height: 1.55; }
          header { border-bottom: 3px solid #00877d; padding-bottom: 14px; margin-bottom: 24px; }
          h1 { margin: 0; color: #00877d; font-size: 24px; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
          @media print { body { margin: 22mm; } }
        </style>
      </head>
      <body>
        <header>
          <h1>Recouvria</h1>
          <p>Courrier de recouvrement - ${escapeHtml(letter.id)}</p>
        </header>
        <pre>${escapeHtml(letter.content)}</pre>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 250);
}

function markLetterSent(id) {
  const letter = getLetter(id);
  if (!letter) return;
  letter.status = "Envoyée";
  saveLetters();
  renderLetters();
  openLetter(id);
  toast("Lettre marquée envoyée");
}

function openClientDetails(id) {
  const client = clients.find((item) => item.id === id);
  if (!client) return;
  const clientCases = cases.filter((item) => item.client.toLowerCase() === client.name.toLowerCase());
  const due = clientCases.reduce((sum, item) => sum + remainingAmount(item), 0);
  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${escapeHtml(client.segment || "Client")}</p>
      <h2>${escapeHtml(client.name)}</h2>
      <p>${escapeHtml(client.contact)} - ${escapeHtml(client.phone)}<br><span class="muted-line">${escapeHtml(client.email)}</span></p>
    </div>
    <div class="detail-grid">
      <div class="detail-stat"><span>Reste dû</span><strong>${formatMoney(due)}</strong></div>
      <div class="detail-stat"><span>Dossiers</span><strong>${clientCases.length}</strong></div>
      <div class="detail-stat"><span>Segment</span><strong>${escapeHtml(client.segment || "B2B")}</strong></div>
      <div class="detail-stat"><span>Contact</span><strong>${escapeHtml(client.contact)}</strong></div>
    </div>
    <section>
      <p class="eyebrow">Notes</p>
      <p>${escapeHtml(client.notes || "Aucune note client.")}</p>
    </section>
    <div class="drawer-actions">
      <button class="primary-button" type="button" data-client-edit="${escapeHtml(client.id)}">Modifier</button>
      <button class="secondary-button" type="button" data-client-letter="${escapeHtml(client.name)}">Générer lettre</button>
    </div>
    <div class="activity-log">
      <p class="eyebrow">Dossiers liés</p>
      ${clientCases.map((item) => `<div><strong>${escapeHtml(item.id)} - ${escapeHtml(item.status)}</strong><span>${formatMoney(remainingAmount(item))}</span></div>`).join("") || "<div><strong>Aucun dossier</strong><span>Client sans créance active</span></div>"}
    </div>
  `;
  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
}

function resetOrderForm() {
  const form = document.querySelector("#orderForm");
  if (!form) return;
  form.dataset.orderId = "";
  form.reset();
  form.querySelector("[name='orderRef']").value = "";
  if (form.querySelector("[name='packaging']")) form.querySelector("[name='packaging']").value = "Unité";
  form.querySelector("[name='date']").value = todayInputValue();
  form.querySelector("[name='status']").value = "Non payée";
  form.querySelector("[data-save-form='orderForm']").textContent = "Ajouter ligne produit";
}

function fillOrderForm(id) {
  const order = getOrder(id);
  const form = document.querySelector("#orderForm");
  if (!order || !form) return;
  form.dataset.orderId = order.id;
  form.querySelector("[name='orderRef']").value = order.orderRef || order.id;
  form.querySelector("[name='client']").value = order.client;
  form.querySelector("[name='product']").value = order.product;
  if (form.querySelector("[name='packaging']")) form.querySelector("[name='packaging']").value = order.packaging;
  form.querySelector("[name='quantity']").value = order.quantity;
  form.querySelector("[name='unitPrice']").value = order.unitPrice;
  form.querySelector("[name='date']").value = order.date;
  form.querySelector("[name='status']").value = order.status;
  form.querySelector("[data-save-form='orderForm']").textContent = "Mettre à jour";
  switchView("administration");
  toast(`Commande ${order.id} prête à modifier`);
}

function saveOrderFromForm(form) {
  const quantity = Math.max(0, Number(fieldValue(form, "quantity")) || 0);
  const unitPrice = parseAmount(fieldValue(form, "unitPrice"));
  const nextOrder = {
    id: form.dataset.orderId || nextOrderId(),
    orderRef: fieldValue(form, "orderRef").trim() || form.dataset.orderId || nextOrderId(),
    client: fieldValue(form, "client").trim(),
    product: fieldValue(form, "product").trim(),
    packaging: normalizePackaging(fieldValue(form, "packaging")),
    quantity,
    unitPrice,
    total: quantity * unitPrice,
    date: fieldValue(form, "date") || todayInputValue(),
    status: fieldValue(form, "status"),
    caseId: getOrder(form.dataset.orderId)?.caseId || ""
  };

  if (!nextOrder.client || !nextOrder.product || nextOrder.total <= 0) {
    toast("Commande incomplète");
    return;
  }

  const index = orders.findIndex((item) => item.id === nextOrder.id);
  if (index >= 0) orders[index] = nextOrder;
  else orders.unshift(nextOrder);
  syncOrderCase(nextOrder);

  saveOrders();
  saveCases();
  refreshViews();
  resetOrderForm();
  toast(nextOrder.caseId ? `Ligne produit enregistrée, commande totalisée dans ${nextOrder.caseId}` : "Ligne produit enregistrée");
}

function generateCaseFromOrder(id) {
  const order = getOrder(id);
  if (!order) return;
  if (order.status === "Payée") {
    toast("Commande payée : aucun dossier à générer");
    return;
  }
  syncOrderCase(order);
  saveOrders();
  saveCases();
  refreshViews();
  if (order.caseId) openDrawer(order.caseId);
  toast(`Dossier généré pour ${order.client}`);
}

function deleteOrder(id) {
  const order = getOrder(id);
  if (!order) return;
  if (!window.confirm(`Supprimer la commande ${order.id} ?`)) return;
  const remainingGroup = getOrderGroup(order).filter((item) => item.id !== id);
  const linkedCase = order.caseId ? getCase(order.caseId) : null;
  orders = orders.filter((item) => item.id !== id);
  if (remainingGroup.length) {
    syncOrderCase(remainingGroup[0]);
  } else if (linkedCase) {
    linkedCase.paid = linkedCase.amount;
    linkedCase.status = "Clôturé";
    linkedCase.risk = "low";
    linkedCase.nextAction = "Commande supprimée";
    linkedCase.nextDate = "Aucune";
    addHistory(linkedCase, `Dernière ligne de commande ${order.orderRef || order.id} supprimée le ${todayLabel()}`);
  }
  saveOrders();
  saveCases();
  refreshViews();
  toast("Commande supprimée");
}

function parseDelimitedLine(line, delimiter) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function importOrdersFromText(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return 0;
  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const firstRow = parseDelimitedLine(lines[0], delimiter);
  const expected = ["commande", "reference", "client", "produit", "conditionnement", "unite", "quantite", "prixunitaire", "montanttotal", "datecommande", "statut"];
  const headers = firstRow.map(normalizeHeader);
  const hasHeader = expected.some((name) => headers.includes(name));
  const body = hasHeader ? lines.slice(1) : lines;
  const indexOf = (aliases, fallback) => {
    const found = aliases.map(normalizeHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0);
    return found ?? fallback;
  };

  let imported = 0;
  body.forEach((line) => {
    const row = parseDelimitedLine(line, delimiter);
    const refColumn = indexOf(["commande", "reference", "référence", "bon commande", "bondecommande"], 0);
    const clientColumn = indexOf(["client", "debiteur", "débiteur"], hasHeader ? 1 : 1);
    const productColumn = indexOf(["produit", "article", "designation", "désignation"], hasHeader ? 2 : 2);
    const packagingColumn = indexOf(["conditionnement", "unité", "unite", "format", "emballage"], -1);
    const fallbackHasPackaging = !hasHeader && ["boite", "boites", "carton", "cartons", "unite", "unites"].includes(normalizeHeader(row[3]));
    const offset = fallbackHasPackaging ? 1 : 0;
    const quantityColumn = indexOf(["quantité", "quantite", "qte"], hasHeader ? 3 : 3 + offset);
    const unitPriceColumn = indexOf(["prix unitaire", "prixunitaire", "pu"], hasHeader ? 4 : 4 + offset);
    const totalColumn = indexOf(["montant total", "montanttotal", "total"], hasHeader ? 5 : 5 + offset);
    const dateColumn = indexOf(["date commande", "datecommande", "date"], hasHeader ? 6 : 6 + offset);
    const statusColumn = indexOf(["statut", "status"], hasHeader ? 7 : 7 + offset);
    const quantity = Math.max(0, Number(row[quantityColumn]) || 0);
    const unitPrice = parseAmount(row[unitPriceColumn]);
    const total = parseAmount(row[totalColumn]) || quantity * unitPrice;
    const order = {
      id: nextOrderId(),
      orderRef: row[refColumn] || "",
      client: row[clientColumn] || "",
      product: row[productColumn] || "",
      packaging: normalizePackaging(row[packagingColumn >= 0 ? packagingColumn : fallbackHasPackaging ? 3 : -1]),
      quantity,
      unitPrice,
      total,
      date: row[dateColumn] || todayInputValue(),
      status: orderStatuses.includes(row[statusColumn]) ? row[statusColumn] : "Non payée",
      caseId: ""
    };
    order.orderRef = order.orderRef || `BC-${order.date.replaceAll("-", "")}-${normalizeHeader(order.client).slice(0, 10)}`;
    if (!order.client || !order.product || order.total <= 0) return;
    orders.unshift(order);
    syncOrderCase(order);
    imported += 1;
  });

  saveOrders();
  saveCases();
  refreshViews();
  return imported;
}

function handleOrderImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const count = importOrdersFromText(String(reader.result || ""));
    toast(count ? `${count} commande(s) importée(s)` : "Aucune commande importée");
  });
  reader.readAsText(file, "utf-8");
}

function resetLocalData() {
  cases = structuredClone(seedCases);
  orders = structuredClone(seedOrders);
  agents = normalizeAgents(structuredClone(seedAgents));
  clients = normalizeClients(buildClientsFromRecords(cases, orders));
  letters = [];
  orders.forEach((order) => {
    if (order.status !== "Payée") syncOrderCase(order);
  });
  saveCases();
  saveOrders();
  saveAgents();
  saveClients();
  saveLetters();
  activeFilter = "all";
  activeAgent = "all";
  activeStatus = "active";
  searchTerm = "";
  document.querySelector("#globalSearch").value = "";
  document.querySelector("#agentFilter").value = "all";
  document.querySelector("#statusFilter").value = "active";
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
  refreshViews();
  closeDrawer();
  switchView("dashboard");
  toast("Données réinitialisées");
}

async function handleFormSave(form) {
  try {
    if (!form) return;
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
    if (form.id === "caseForm") saveCaseFromForm(form);
    if (form.id === "reminderForm") await saveReminderFromForm(form);
    if (form.id === "paymentForm") savePaymentFromForm(form);
    if (form.id === "promiseForm") savePromiseFromForm(form);
    if (form.id === "orderForm") saveOrderFromForm(form);
    if (form.id === "clientForm") saveClientFromForm(form);
    if (form.id === "agentForm") saveAgentFromForm(form);
  } catch (error) {
    console.error(error);
    toast(`Erreur formulaire : ${error.message}`);
  }
}

window.handleFormSave = handleFormSave;
globalThis.handleFormSave = handleFormSave;

function bindFormButton(formId) {
  const form = document.getElementById(formId);
  const button = document.querySelector(`[data-save-form="${formId}"]`);
  if (!form || !button) return;
  button.addEventListener("click", () => handleFormSave(form));
}

function closestAction(target, selector) {
  const element = target?.nodeType === 1 ? target : target?.parentElement;
  return element?.closest(selector) || null;
}

function openClientForm(id = "") {
  const client = clients.find((item) => item.id === id) || {
    id: nextClientId(),
    name: "",
    contact: "",
    phone: "",
    email: "",
    segment: "B2B",
    notes: ""
  };
  const isNew = !id;
  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${isNew ? "Nouveau client" : escapeHtml(client.id)}</p>
      <h2>${isNew ? "Ajouter un client" : "Modifier le client"}</h2>
      <p>La fiche client alimente les dossiers, commandes et lettres.</p>
    </div>
    <div class="case-form" id="clientForm" data-client-id="${escapeHtml(client.id)}" data-original-name="${escapeHtml(client.name)}">
      <label>
        <span>Client</span>
        <input name="name" value="${escapeHtml(client.name)}" required />
      </label>
      <label>
        <span>Contact principal</span>
        <input name="contact" value="${escapeHtml(client.contact)}" required />
      </label>
      <label>
        <span>Téléphone</span>
        <input name="phone" value="${escapeHtml(client.phone)}" required />
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" value="${escapeHtml(client.email)}" required />
      </label>
      <label>
        <span>Segment</span>
        <select name="segment">
          ${["B2B", "Grand compte", "PME", "Précontentieux", "Public"].map((segment) => `<option value="${segment}" ${segment === client.segment ? "selected" : ""}>${segment}</option>`).join("")}
        </select>
      </label>
      <label class="full">
        <span>Notes</span>
        <textarea name="notes" rows="4">${escapeHtml(client.notes)}</textarea>
      </label>
      <div class="form-actions">
        <button class="primary-button" type="button" data-save-form="clientForm">${isNew ? "Créer client" : "Sauvegarder"}</button>
        <button class="secondary-button" type="button" data-close-form>Annuler</button>
      </div>
    </div>
  `;
  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
  bindFormButton("clientForm");
}

function saveClientFromForm(form) {
  const id = form.dataset.clientId;
  const originalName = form.dataset.originalName;
  const nextClient = {
    id,
    name: fieldValue(form, "name").trim(),
    contact: fieldValue(form, "contact").trim(),
    phone: fieldValue(form, "phone").trim(),
    email: fieldValue(form, "email").trim(),
    segment: fieldValue(form, "segment"),
    notes: fieldValue(form, "notes").trim()
  };
  const index = clients.findIndex((item) => item.id === id);
  if (index >= 0) clients[index] = nextClient;
  else clients.unshift(nextClient);

  if (originalName && originalName !== nextClient.name) {
    cases.forEach((item) => {
      if (item.client === originalName) item.client = nextClient.name;
    });
    orders.forEach((item) => {
      if (item.client === originalName) item.client = nextClient.name;
    });
  }

  cases.forEach((item) => {
    if (item.client === nextClient.name) {
      item.contact = nextClient.contact || item.contact;
      item.phone = nextClient.phone || item.phone;
      item.email = nextClient.email || item.email;
    }
  });

  saveClients();
  saveCases();
  saveOrders();
  refreshViews();
  openClientDetails(id);
  toast(index >= 0 ? "Client mis à jour" : "Client ajouté");
}

function openAgentForm(id = "") {
  const agent = agents.find((item) => item.id === id) || {
    id: nextAgentId(),
    name: "",
    email: "",
    phone: "",
    role: "Chargé recouvrement",
    recovered: 0,
    target: 10000000,
    cases: 0,
    active: true
  };
  const isNew = !id;
  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${isNew ? "Nouvel agent" : escapeHtml(agent.id)}</p>
      <h2>${isNew ? "Ajouter un agent" : "Modifier l'agent"}</h2>
      <p>Les agents sont utilisés dans les dossiers, filtres et rapports.</p>
    </div>
    <div class="case-form" id="agentForm" data-agent-id="${escapeHtml(agent.id)}" data-original-name="${escapeHtml(agent.name)}">
      <label>
        <span>Nom</span>
        <input name="name" value="${escapeHtml(agent.name)}" required />
      </label>
      <label>
        <span>Rôle</span>
        <input name="role" value="${escapeHtml(agent.role)}" required />
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" value="${escapeHtml(agent.email)}" required />
      </label>
      <label>
        <span>Téléphone</span>
        <input name="phone" value="${escapeHtml(agent.phone)}" required />
      </label>
      <label>
        <span>Objectif mensuel</span>
        <input name="target" type="number" min="0" step="100000" value="${agent.target}" required />
      </label>
      <label>
        <span>Déjà recouvré</span>
        <input name="recovered" type="number" min="0" step="100000" value="${agent.recovered}" required />
      </label>
      <label>
        <span>Statut</span>
        <select name="active">
          <option value="true" ${agent.active ? "selected" : ""}>Actif</option>
          <option value="false" ${!agent.active ? "selected" : ""}>Inactif</option>
        </select>
      </label>
      <div class="form-actions">
        <button class="primary-button" type="button" data-save-form="agentForm">${isNew ? "Créer agent" : "Sauvegarder"}</button>
        <button class="secondary-button" type="button" data-close-form>Annuler</button>
      </div>
    </div>
  `;
  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
  bindFormButton("agentForm");
}

function saveAgentFromForm(form) {
  const id = form.dataset.agentId;
  const originalName = form.dataset.originalName;
  const nextAgent = {
    id,
    name: fieldValue(form, "name").trim(),
    email: fieldValue(form, "email").trim(),
    phone: fieldValue(form, "phone").trim(),
    role: fieldValue(form, "role").trim(),
    target: Math.max(0, Number(fieldValue(form, "target")) || 0),
    recovered: Math.max(0, Number(fieldValue(form, "recovered")) || 0),
    cases: cases.filter((item) => item.agent === fieldValue(form, "name").trim() && !item.archived).length,
    active: fieldValue(form, "active") === "true"
  };
  const index = agents.findIndex((item) => item.id === id);
  if (index >= 0) agents[index] = nextAgent;
  else agents.unshift(nextAgent);
  if (originalName && originalName !== nextAgent.name) {
    cases.forEach((item) => {
      if (item.agent === originalName) item.agent = nextAgent.name;
    });
  }
  saveAgents();
  saveCases();
  refreshViews();
  closeDrawer();
  toast(index >= 0 ? "Agent mis à jour" : "Agent ajouté");
}

function toggleAgent(id) {
  const agent = agents.find((item) => item.id === id);
  if (!agent) return;
  agent.active = !agent.active;
  saveAgents();
  refreshViews();
  toast(agent.active ? "Agent réactivé" : "Agent désactivé");
}

function openCaseForm(id = "") {
  const item = cases.find((entry) => entry.id === id) || {
    id: nextCaseId(),
    client: "",
    contact: "",
    phone: "",
    email: "",
    amount: 0,
    paid: 0,
    delay: 0,
    risk: "medium",
    archived: false,
    agent: agents[0].name,
    status: "Nouveau",
    nextAction: "Premier appel",
    nextDate: "Aujourd'hui 09:00",
    promise: "",
    history: ["Dossier créé manuellement"]
  };
  const isNew = !id;

  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${isNew ? "Nouveau dossier" : escapeHtml(item.id)}</p>
      <h2>${isNew ? "Créer un dossier portefeuille" : "Modifier le dossier"}</h2>
      <p>Les champs sauvegardés mettent à jour le portefeuille, les rapports et les priorités.</p>
    </div>

    <div class="case-form" id="caseForm" data-case-id="${escapeHtml(item.id)}" data-mode="${isNew ? "create" : "edit"}">
      <label>
        <span>Débiteur</span>
        <input name="client" value="${escapeHtml(item.client)}" required />
      </label>
      <label>
        <span>Contact principal</span>
        <input name="contact" value="${escapeHtml(item.contact)}" required />
      </label>
      <label>
        <span>Téléphone</span>
        <input name="phone" value="${escapeHtml(item.phone)}" required />
      </label>
      <label>
        <span>Email</span>
        <input name="email" type="email" value="${escapeHtml(item.email || "")}" required />
      </label>
      <label>
        <span>Agent responsable</span>
        <select name="agent">
          ${agents.map((agent) => `<option value="${escapeHtml(agent.name)}" ${agent.name === item.agent ? "selected" : ""}>${escapeHtml(agent.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Montant initial</span>
        <input name="amount" type="number" min="0" step="1000" value="${item.amount}" required />
      </label>
      <label>
        <span>Déjà payé</span>
        <input name="paid" type="number" min="0" step="1000" value="${item.paid}" required />
      </label>
      <label>
        <span>Retard en jours</span>
        <input name="delay" type="number" min="0" step="1" value="${item.delay}" required />
      </label>
      <label>
        <span>Niveau de risque</span>
        <select name="risk">
          ${riskOptions.map(([value, label]) => `<option value="${value}" ${value === item.risk ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Statut</span>
        <select name="status">
          ${statusOptions.map((status) => `<option value="${escapeHtml(status)}" ${status === item.status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}
        </select>
      </label>
      <label>
        <span>Prochaine échéance</span>
        <input name="nextDate" value="${escapeHtml(item.nextDate)}" required />
      </label>
      <label class="full">
        <span>Prochaine action</span>
        <input name="nextAction" value="${escapeHtml(item.nextAction)}" required />
      </label>
      <label class="full">
        <span>Engagement de paiement</span>
        <textarea name="promise" rows="3" placeholder="Ex : 1 500 000 FCFA le 31/05">${escapeHtml(item.promise)}</textarea>
      </label>

      <div class="form-actions">
        <button class="primary-button" type="button" data-save-form="caseForm">${isNew ? "Créer le dossier" : "Sauvegarder"}</button>
        <button class="secondary-button" type="button" ${isNew ? "data-close-form" : `data-open="${escapeHtml(item.id)}"`}>Annuler</button>
      </div>
    </div>
  `;

  document.querySelector("#drawer").classList.add("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "false");
  bindFormButton("caseForm");
}

function saveCaseFromForm(form) {
  const id = form.dataset.caseId;
  const amount = Math.max(0, Number(fieldValue(form, "amount")) || 0);
  const paid = Math.min(amount, Math.max(0, Number(fieldValue(form, "paid")) || 0));
  const nextItem = {
    id,
    client: fieldValue(form, "client").trim(),
    contact: fieldValue(form, "contact").trim(),
    phone: fieldValue(form, "phone").trim(),
    email: fieldValue(form, "email").trim(),
    amount,
    paid,
    delay: Math.max(0, Number(fieldValue(form, "delay")) || 0),
    risk: fieldValue(form, "risk"),
    agent: fieldValue(form, "agent"),
    status: fieldValue(form, "status"),
    archived: cases.find((item) => item.id === id)?.archived || false,
    nextAction: fieldValue(form, "nextAction").trim(),
    nextDate: fieldValue(form, "nextDate").trim(),
    promise: fieldValue(form, "promise").trim(),
    history: []
  };

  const existingIndex = cases.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    nextItem.history = ["Dossier modifié manuellement", ...cases[existingIndex].history].slice(0, 6);
    cases[existingIndex] = nextItem;
  } else {
    nextItem.history = ["Dossier créé manuellement"];
    cases.unshift(nextItem);
    activeFilter = "all";
    activeAgent = "all";
    searchTerm = "";
    document.querySelector("#globalSearch").value = "";
    document.querySelector("#agentFilter").value = "all";
    document.querySelectorAll(".segmented button").forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === "all");
    });
    switchView("portfolio");
  }

  saveCases();
  refreshViews();
  openDrawer(id);
  toast(existingIndex >= 0 ? "Dossier portefeuille modifié" : "Nouveau dossier ajouté au portefeuille");
}

function closeDrawer() {
  document.querySelector("#drawer").classList.remove("open");
  document.querySelector("#drawer").setAttribute("aria-hidden", "true");
}

function toast(message) {
  const element = document.querySelector("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.setTimeout(() => element.classList.remove("show"), 2200);
}

function switchView(view) {
  document.querySelectorAll(".view").forEach((section) => section.classList.toggle("active", section.id === view));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
}

function updateSessionBadge(message = "") {
  const userName = document.querySelector("#sessionUser");
  const sync = document.querySelector("#syncStatus");
  if (userName) userName.textContent = currentUser?.name || (apiMode ? "Utilisateur" : "Mode local");
  if (sync) sync.textContent = message || (apiMode ? "Base SQLite" : cloudSyncMode ? "Base Supabase" : "Base locale non partagée");
}

function isPublicAuthenticated() {
  return sessionStorage.getItem(publicAuthKey) === "true";
}

function authenticatePublic(form) {
  const email = fieldValue(form, "email").trim().toLowerCase();
  const password = fieldValue(form, "password");
  return email === publicLoginEmail && password === publicLoginPassword;
}

function shouldUseBackendApi() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function showAuth(message = "") {
  const gate = document.querySelector("#authGate");
  const shell = document.querySelector("#appShell");
  const error = document.querySelector("#loginError");
  if (gate) gate.hidden = false;
  if (shell) shell.hidden = true;
  if (error) error.textContent = message;
  document.body.classList.add("auth-layout");
}

function showApp() {
  const gate = document.querySelector("#authGate");
  const shell = document.querySelector("#appShell");
  if (gate) gate.hidden = true;
  if (shell) shell.hidden = false;
  document.body.classList.remove("auth-layout");
  updateSessionBadge();
}

function startApplication() {
  ensureOrderCases();
  renderKpis();
  renderPriorityList();
  renderChart();
  renderChannels();
  renderAgentFilter();
  renderTable();
  renderRelances();
  renderPayments();
  renderReports();
  renderOrders();
  renderOrderSheet();
  renderClients();
  renderAgentsAdmin();
  renderLetters();
  loadClientRequests();
  resetOrderForm();
}

async function hydrateFromServer() {
  const payload = await apiRequest("/api/bootstrap");
  currentUser = payload.user;
  applyBootstrap(payload);
}

async function persistCloudState() {
  try {
    const response = await fetch(cloudStateEndpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-recouvria-admin-password": publicLoginPassword
      },
      body: JSON.stringify(statePayload())
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.configured === false) {
      cloudSyncMode = false;
      return false;
    }
    cloudSyncMode = true;
    return true;
  } catch (error) {
    console.error(error);
    cloudSyncMode = false;
    return false;
  }
}

async function syncCloudNow() {
  updateSessionBadge("Synchronisation cloud...");
  try {
    if (apiMode) {
      await apiRequest("/api/state", {
        method: "PUT",
        body: JSON.stringify(statePayload())
      });
    }
    const synced = await persistCloudState();
    if (!synced) throw new Error("Supabase n'est pas prêt");
    updateSessionBadge("Base envoyée vers Supabase");
    toast("Base synchronisée pour PC et téléphone");
  } catch (error) {
    console.error(error);
    updateSessionBadge("Synchronisation cloud impossible");
    toast("Synchronisation impossible : vérifie Supabase");
  }
}

async function hydrateFromCloudState() {
  try {
    const payload = await apiRequest("/api/state", {
      headers: { "x-recouvria-admin-password": publicLoginPassword }
    });
    if (payload.configured === false) {
      cloudSyncMode = false;
      updateSessionBadge("Supabase non configuré");
      return false;
    }
    cloudSyncMode = true;
    if (payload.state) applyBootstrap(payload.state);
    else {
      await apiRequest("/api/state", {
        method: "PUT",
        headers: { "x-recouvria-admin-password": publicLoginPassword },
        body: JSON.stringify(statePayload())
      });
    }
    updateSessionBadge(payload.state ? "Base Supabase chargée" : "Base Supabase initialisée");
    return true;
  } catch (error) {
    console.error(error);
    cloudSyncMode = false;
    updateSessionBadge("Base locale non partagée");
    return false;
  }
}

async function initializeAuth() {
  if (!shouldUseBackendApi()) {
    apiMode = false;
    if (!isPublicAuthenticated()) {
      showAuth("Entre le mot de passe pour ouvrir Recouvria.");
      return;
    }
    currentUser = { name: "Accès partagé", email: publicLoginEmail };
    showApp();
    await hydrateFromCloudState();
    startApplication();
    if (!cloudSyncMode) updateSessionBadge("Accès protégé local");
    return;
  }

  try {
    const session = await apiRequest("/api/session");
    apiMode = true;
    if (!session.authenticated) {
      showAuth("Connecte-toi pour accéder à la base Recouvria.");
      return;
    }
    currentUser = session.user;
    await hydrateFromServer();
    showApp();
    persistCloudState().then((synced) => {
      updateSessionBadge(synced ? "Base locale envoyée vers Supabase" : "Base locale PC");
    });
    startApplication();
  } catch (error) {
    apiMode = false;
    if (!isPublicAuthenticated()) {
      showAuth("Entre le mot de passe pour ouvrir Recouvria.");
      return;
    }
    currentUser = { name: "Accès partagé", email: publicLoginEmail };
    showApp();
    await hydrateFromCloudState();
    startApplication();
    if (!cloudSyncMode) updateSessionBadge("Accès protégé local");
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const error = document.querySelector("#loginError");
  if (error) error.textContent = "";
  if (button) button.disabled = true;
  try {
    if (!apiMode && authenticatePublic(form)) {
      sessionStorage.setItem(publicAuthKey, "true");
      currentUser = { name: "Accès partagé", email: publicLoginEmail };
      showApp();
      await hydrateFromCloudState();
      startApplication();
      if (!cloudSyncMode) updateSessionBadge("Accès protégé local");
      toast("Connexion réussie");
      return;
    }

    const payload = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({
        email: fieldValue(form, "email").trim(),
        password: fieldValue(form, "password")
      })
    });
    apiMode = true;
    currentUser = payload.user;
    await hydrateFromServer();
    showApp();
    startApplication();
    toast("Connexion réussie");
  } catch (errorMessage) {
    if (!apiMode && !authenticatePublic(form)) {
      if (error) error.textContent = "Email ou mot de passe incorrect.";
    } else if (error) {
      error.textContent = errorMessage.message || "Connexion impossible";
    }
  } finally {
    if (button) button.disabled = false;
  }
}

async function logout() {
  if (apiMode) {
    try {
      await apiRequest("/api/logout", { method: "POST", body: "{}" });
    } catch (error) {
      console.error(error);
    }
  }
  currentUser = null;
  sessionStorage.removeItem(publicAuthKey);
  if (apiMode) showAuth("Session fermée.");
  else showAuth("Session fermée.");
}

function bindEvents() {
  document.querySelector("#loginForm")?.addEventListener("submit", handleLogin);
  document.querySelector("#logoutButton")?.addEventListener("click", logout);
  document.querySelector("#cloudSyncButton")?.addEventListener("click", syncCloudNow);
  document.querySelector("#newClientButton")?.addEventListener("click", () => openClientForm());
  document.querySelector("#newAgentButton")?.addEventListener("click", () => openAgentForm());
  document.querySelector("#refreshClientRequests")?.addEventListener("click", loadClientRequests);
  document.querySelector("#generateLetterButton")?.addEventListener("click", () => {
    const id = document.querySelector("#letterCaseSelect")?.value;
    if (id) generateLetterForCase(id, document.querySelector("#letterTypeSelect")?.value || "Mise en demeure");
    else toast("Aucun dossier actif disponible");
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-view-link]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.viewLink));
  });

  document.querySelector("#globalSearch").addEventListener("input", (event) => {
    searchTerm = event.target.value.trim().toLowerCase();
    renderTable();
  });

  document.querySelectorAll(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll(".segmented button").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderTable();
    });
  });

  document.querySelector("#agentFilter").addEventListener("change", (event) => {
    activeAgent = event.target.value;
    renderTable();
  });

  document.querySelector("#statusFilter").addEventListener("change", (event) => {
    activeStatus = event.target.value;
    renderTable();
  });

  document.body.addEventListener("click", async (event) => {
    const openButton = closestAction(event.target, "[data-open]");
    const editButton = closestAction(event.target, "[data-edit]");
    const closeFormButton = closestAction(event.target, "[data-close-form]");
    const reminderButton = closestAction(event.target, "[data-reminder]");
    const reminderFormButton = closestAction(event.target, "[data-reminder-form]");
    const paymentFormButton = closestAction(event.target, "[data-payment-form]");
    const paymentFullButton = closestAction(event.target, "[data-payment-full]");
    const promiseFormButton = closestAction(event.target, "[data-promise-form]");
    const scenarioButton = closestAction(event.target, "[data-scenario]");
    const saveFormButton = closestAction(event.target, "[data-save-form]");
    const submitButton = closestAction(event.target, "[data-submit-form]");
    const actionButton = closestAction(event.target, "[data-action]");
    const printCaseButton = closestAction(event.target, "[data-print-case]");
    const archiveCaseButton = closestAction(event.target, "[data-archive-case]");
    const restoreCaseButton = closestAction(event.target, "[data-restore-case]");
    const deleteCaseButton = closestAction(event.target, "[data-delete-case]");
    const editOrderButton = closestAction(event.target, "[data-edit-order]");
    const generateCaseButton = closestAction(event.target, "[data-generate-case]");
    const deleteOrderButton = closestAction(event.target, "[data-delete-order]");
    const resetOrderButton = closestAction(event.target, "[data-reset-order-form]");
    const addSheetRowButton = closestAction(event.target, "[data-add-sheet-row]");
    const saveSheetButton = closestAction(event.target, "[data-save-sheet]");
    const exportCaseOrdersButton = closestAction(event.target, "[data-export-case-orders]");
    const generateLetterButton = closestAction(event.target, "[data-generate-letter]");
    const letterOpenButton = closestAction(event.target, "[data-letter-open]");
    const letterPrintButton = closestAction(event.target, "[data-letter-print]");
    const letterStatusButton = closestAction(event.target, "[data-letter-status]");
    const clientOpenButton = closestAction(event.target, "[data-client-open]");
    const clientEditButton = closestAction(event.target, "[data-client-edit]");
    const clientLetterButton = closestAction(event.target, "[data-client-letter]");
    const agentEditButton = closestAction(event.target, "[data-agent-edit]");
    const agentToggleButton = closestAction(event.target, "[data-agent-toggle]");
    const clientRequestOpenButton = closestAction(event.target, "[data-client-request-open]");
    const clientRequestDoneButton = closestAction(event.target, "[data-client-request-done]");
    const clientRequestStatusButton = closestAction(event.target, "[data-client-request-status]");
    const clientRequestEmailButton = closestAction(event.target, "[data-client-request-email]");
    const clientLinkButton = closestAction(event.target, "[data-client-link]");
    const clientLinkEmailButton = closestAction(event.target, "[data-client-link-email]");

    if (saveFormButton) {
      event.preventDefault();
      toast("Sauvegarde en cours");
      handleFormSave(document.getElementById(saveFormButton.dataset.saveForm));
      return;
    }
    if (submitButton) {
      event.preventDefault();
      const form = document.querySelector(`#${submitButton.dataset.submitForm}`);
      if (form) handleFormSave(form);
      return;
    }
    if (openButton?.dataset.open?.startsWith("__submit:")) {
      event.preventDefault();
      handleFormSave(document.getElementById(openButton.dataset.open.replace("__submit:", "")));
      return;
    }
    if (openButton) openDrawer(openButton.dataset.open);
    if (editButton) openCaseForm(editButton.dataset.edit);
    if (closeFormButton) closeDrawer();
    if (reminderButton) await registerReminder(reminderButton.dataset.reminder, reminderButton.dataset.channel || "call");
    if (reminderFormButton) openReminderForm(reminderFormButton.dataset.reminderForm, reminderFormButton.dataset.channel || "call");
    if (paymentFormButton) openPaymentForm(paymentFormButton.dataset.paymentForm);
    if (paymentFullButton) registerFullPayment(paymentFullButton.dataset.paymentFull);
    if (promiseFormButton) openPromiseForm(promiseFormButton.dataset.promiseForm);
    if (scenarioButton) applyScenario(Number(scenarioButton.dataset.scenario));
    if (printCaseButton) printCasePdf(printCaseButton.dataset.printCase);
    if (archiveCaseButton) archiveCase(archiveCaseButton.dataset.archiveCase);
    if (restoreCaseButton) restoreCase(restoreCaseButton.dataset.restoreCase);
    if (deleteCaseButton) deleteCase(deleteCaseButton.dataset.deleteCase);
    if (editOrderButton) fillOrderForm(editOrderButton.dataset.editOrder);
    if (generateCaseButton) generateCaseFromOrder(generateCaseButton.dataset.generateCase);
    if (deleteOrderButton) deleteOrder(deleteOrderButton.dataset.deleteOrder);
    if (resetOrderButton) resetOrderForm();
    if (addSheetRowButton) addOrderSheetRow();
    if (saveSheetButton) saveOrderSheet();
    if (exportCaseOrdersButton) exportCaseOrdersExcel(exportCaseOrdersButton.dataset.exportCaseOrders);
    if (generateLetterButton) generateLetterForCase(generateLetterButton.dataset.generateLetter);
    if (letterOpenButton) openLetter(letterOpenButton.dataset.letterOpen);
    if (letterPrintButton) printLetter(letterPrintButton.dataset.letterPrint);
    if (letterStatusButton) markLetterSent(letterStatusButton.dataset.letterStatus);
    if (clientOpenButton) openClientDetails(clientOpenButton.dataset.clientOpen);
    if (clientEditButton) openClientForm(clientEditButton.dataset.clientEdit);
    if (clientLetterButton) generateLetterForClient(clientLetterButton.dataset.clientLetter);
    if (agentEditButton) openAgentForm(agentEditButton.dataset.agentEdit);
    if (agentToggleButton) toggleAgent(agentToggleButton.dataset.agentToggle);
    if (clientLinkButton) copyClientPortalLink(clientLinkButton.dataset.clientLink);
    if (clientLinkEmailButton) await emailClientPortalLink(clientLinkEmailButton.dataset.clientLinkEmail);
    if (clientRequestOpenButton) openClientRequest(clientRequestOpenButton.dataset.clientRequestOpen);
    if (clientRequestDoneButton) markClientRequestDone(clientRequestDoneButton.dataset.clientRequestDone);
    if (clientRequestStatusButton) {
      updateClientRequestStatus(
        clientRequestStatusButton.dataset.clientRequestStatus,
        clientRequestStatusButton.dataset.clientRequestNextStatus,
        clientRequestStatusButton.dataset.clientRequestNextStatus === "accordé" ? "Échéancier accordé" : "Échéancier refusé"
      );
    }
    if (clientRequestEmailButton) {
      const email = clientRequestEmailButton.dataset.clientRequestEmail;
      if (email) {
        openMailto(email, "Réponse KFN Pharma - Recouvrement", "");
      } else {
        toast("Email client indisponible");
      }
    }
    if (actionButton) toast(`${actionButton.dataset.action} pour ${actionButton.dataset.id}`);
  });

  document.addEventListener("pointerdown", (event) => {
    const submitButton = closestAction(event.target, "[data-submit-form], [data-save-form]");
    if (!submitButton) return;
    event.preventDefault();
    const formId = submitButton.dataset.submitForm || submitButton.dataset.saveForm;
    const form = document.querySelector(`#${formId}`);
    if (form) handleFormSave(form);
  }, true);

  document.body.addEventListener("submit", (event) => {
    if (!["caseForm", "reminderForm", "paymentForm", "promiseForm", "orderForm", "clientForm", "agentForm"].includes(event.target.id)) return;
    event.preventDefault();
    handleFormSave(event.target);
  });

  document.querySelector("#closeDrawer").addEventListener("click", closeDrawer);
  document.querySelector("#drawer").addEventListener("click", (event) => {
    if (event.target.id === "drawer") closeDrawer();
  });

  document.querySelector("#exportButton").addEventListener("click", exportCases);
  document.querySelector("#newCaseButton").addEventListener("click", () => openCaseForm());
  document.querySelector("#promiseButton").addEventListener("click", () => openPromiseForm());
  document.querySelector("#orderSheetButton").addEventListener("click", toggleOrderSheet);
  document.querySelector("#exportOrdersButton").addEventListener("click", exportSelectedOrdersExcel);
  document.querySelector("#orderImport").addEventListener("change", (event) => {
    handleOrderImport(event.target.files?.[0]);
    event.target.value = "";
  });
}

async function init() {
  bindEvents();
  await initializeAuth();
}

init();
