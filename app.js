const seedCases = [
  {
    id: "RC-2026-0148",
    client: "Clinique Saint Gabriel",
    contact: "Awa Kouame",
    phone: "+225 07 48 22 91 34",
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

let cases = loadCases();

const agents = [
  { name: "Mariam Traore", recovered: 14800000, target: 20000000, cases: 18 },
  { name: "Jean Koffi", recovered: 11900000, target: 18000000, cases: 21 },
  { name: "Prisca Toure", recovered: 9700000, target: 14000000, cases: 14 }
];

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
let searchTerm = "";

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
const storageKey = "recouvriaCasesV3";

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

function normalizeCases(items) {
  return items.map((item) => {
    const nextItem = { ...item, history: item.history || [] };
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
}

function refreshViews() {
  renderKpis();
  renderPriorityList();
  renderTable();
  renderRelances();
  renderPayments();
  renderReports();
}

function nextCaseId() {
  const maxNumber = cases.reduce((max, item) => {
    const number = Number(item.id.split("-").pop());
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 0);

  return `RC-2026-${String(maxNumber + 1).padStart(4, "0")}`;
}

function getCase(id) {
  return cases.find((item) => item.id === id);
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
  if (item.status.includes("contentieux") || item.status.includes("Précontentieux")) return "legal";
  if (item.status.includes("Promesse")) return "promise";
  return "neutral";
}

function getFilteredCases() {
  return cases.filter((item) => {
    const haystack = `${item.id} ${item.client} ${item.contact} ${item.phone} ${item.agent} ${item.status}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm);
    const matchesAgent = activeAgent === "all" || item.agent === activeAgent;
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "urgent" && (item.risk === "high" || item.risk === "legal")) ||
      (activeFilter === "promise" && item.promise) ||
      (activeFilter === "legal" && item.risk === "legal");

    return matchesSearch && matchesAgent && matchesFilter;
  });
}

function renderKpis() {
  const totalDue = cases.reduce((sum, item) => sum + item.amount - item.paid, 0);
  const recovered = cases.reduce((sum, item) => sum + item.paid, 0);
  const urgent = cases.filter((item) => remainingAmount(item) > 0 && (item.risk === "high" || item.risk === "legal")).length;
  const promises = cases.filter((item) => remainingAmount(item) > 0 && item.promise).length;

  const data = [
    ["C", "Créances nettes", formatMoney(totalDue), "+8 dossiers cette semaine", "var(--teal-soft)", "var(--teal)"],
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
    .filter((item) => remainingAmount(item) > 0 && (item.risk === "high" || item.risk === "legal"))
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
    <tr>
      <td><strong>${item.id}</strong><small>${item.nextDate}</small></td>
      <td><strong>${item.client}</strong><small>${item.contact} - ${item.phone}</small></td>
      <td class="amount">${formatMoney(remainingAmount(item))}</td>
      <td>${item.delay} jours</td>
      <td><span class="badge ${item.risk}">${riskLabel(item.risk)}</span></td>
      <td>${item.agent}</td>
      <td><span class="badge ${statusClass(item)}">${item.status}</span></td>
      <td>
        <div class="mini-actions">
          <button type="button" title="Ouvrir" data-open="${item.id}">O</button>
          <button type="button" title="Modifier" data-edit="${item.id}">M</button>
          <button type="button" title="${settled ? "Dossier soldé" : "Relancer"}" ${settled ? "disabled" : `data-reminder-form="${item.id}"`}>R</button>
          <button type="button" title="${settled ? "Dossier soldé" : "Paiement"}" ${settled ? "disabled" : `data-payment-form="${item.id}"`}>P</button>
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
    .filter((item) => remainingAmount(item) > 0 && item.status !== "Clôturé")
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
  const due = cases.reduce((sum, item) => sum + item.amount - item.paid, 0);
  const recovered = cases.reduce((sum, item) => sum + item.paid, 0);
  const avgDelay = Math.round(cases.reduce((sum, item) => sum + item.delay, 0) / cases.length);

  const report = [
    ["Créances suivies", formatMoney(due)],
    ["Encaissements cumulés", formatMoney(recovered)],
    ["Retard moyen", `${avgDelay} jours`],
    ["Dossiers précontentieux", cases.filter((item) => item.risk === "legal").length],
    ["Promesses actives", cases.filter((item) => item.promise).length]
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

function openDrawer(id) {
  const item = cases.find((entry) => entry.id === id);
  if (!item) return;
  const due = remainingAmount(item);
  const settled = due <= 0 || item.status === "Clôturé";
  const actionPanel = settled
    ? `
      <button class="primary-button" type="button" data-edit="${item.id}">Modifier le dossier</button>
      <button class="secondary-button" type="button" disabled>Paiement soldé</button>
      <button class="secondary-button" type="button" disabled>Relances désactivées</button>
      <button class="secondary-button" type="button" disabled>Aucun engagement requis</button>
    `
    : `
      <button class="primary-button" type="button" data-edit="${item.id}">Modifier le dossier</button>
      <button class="primary-button" type="button" data-payment-form="${item.id}">Encaisser paiement</button>
      <button class="secondary-button" type="button" data-payment-full="${item.id}">Encaisser tout</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="call">Appeler</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="sms">Envoyer SMS</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="email">Email</button>
      <button class="secondary-button" type="button" data-reminder="${item.id}" data-channel="notice">Mise en demeure</button>
      <button class="secondary-button" type="button" data-promise-form="${item.id}">Engagement</button>
    `;

  document.querySelector("#drawerContent").innerHTML = `
    <div class="detail-header">
      <p class="eyebrow">${item.id}</p>
      <h2>${item.client}</h2>
      <p>${item.contact} - ${item.phone}</p>
      <div class="meta-row">
        <span class="badge ${item.risk}">${riskLabel(item.risk)}</span>
        <span class="badge ${statusClass(item)}">${item.status}</span>
      </div>
    </div>

      <div class="detail-grid">
      <div class="detail-stat"><span>Montant initial</span><strong>${formatMoney(item.amount)}</strong></div>
      <div class="detail-stat"><span>Reste dû</span><strong>${formatMoney(due)}</strong></div>
      <div class="detail-stat"><span>Retard</span><strong>${item.delay} jours</strong></div>
      <div class="detail-stat"><span>Agent</span><strong>${item.agent}</strong></div>
    </div>

    ${settled ? `<div class="settled-note"><strong>Dossier soldé</strong><span>Les actions de paiement et de relance sont désactivées tant qu'il n'y a plus de montant à recouvrer.</span></div>` : ""}

    <section>
      <p class="eyebrow">Prochaine action</p>
      <h3>${item.nextAction}</h3>
      <p>${item.nextDate}</p>
      ${item.promise ? `<p><strong>Engagement :</strong> ${item.promise}</p>` : ""}
    </section>

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
  if (item && (remainingAmount(item) <= 0 || item.status === "Clôturé")) {
    openDrawer(id);
    toast("Ce dossier est soldé : aucun engagement requis");
    return;
  }
  const selectedId = item?.id || cases[0]?.id || "";

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
          ${cases.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === selectedId ? "selected" : ""}>${escapeHtml(entry.id)} - ${escapeHtml(entry.client)}</option>`).join("")}
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

function registerReminder(id, channel, note = "", nextAction = "Suivi de relance", nextDate = "Dans 48h") {
  const item = getCase(id);
  if (!item) return;
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
  toast(`${label} enregistré pour ${item.client}`);
}

function saveReminderFromForm(form) {
  registerReminder(
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
    .filter((item) => remainingAmount(item) > 0 && item.status !== "Clôturé")
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
  const headers = ["Dossier", "Débiteur", "Contact", "Téléphone", "Montant initial", "Payé", "Reste dû", "Retard", "Risque", "Agent", "Statut", "Promesse", "Prochaine action", "Prochaine échéance"];
  const rows = cases.map((item) => [
    item.id,
    item.client,
    item.contact,
    item.phone,
    item.amount,
    item.paid,
    remainingAmount(item),
    item.delay,
    riskLabel(item.risk),
    item.agent,
    item.status,
    item.promise,
    item.nextAction,
    item.nextDate
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recouvria-portefeuille-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("Export CSV généré");
}

function resetDemo() {
  cases = structuredClone(seedCases);
  saveCases();
  activeFilter = "all";
  activeAgent = "all";
  searchTerm = "";
  document.querySelector("#globalSearch").value = "";
  document.querySelector("#agentFilter").value = "all";
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });
  refreshViews();
  closeDrawer();
  switchView("demo");
  toast("Données de démonstration réinitialisées");
}

function handleFormSave(form) {
  try {
    if (!form) return;
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
    if (form.id === "caseForm") saveCaseFromForm(form);
    if (form.id === "reminderForm") saveReminderFromForm(form);
    if (form.id === "paymentForm") savePaymentFromForm(form);
    if (form.id === "promiseForm") savePromiseFromForm(form);
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

function openCaseForm(id = "") {
  const item = cases.find((entry) => entry.id === id) || {
    id: nextCaseId(),
    client: "",
    contact: "",
    phone: "",
    amount: 0,
    paid: 0,
    delay: 0,
    risk: "medium",
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
    amount,
    paid,
    delay: Math.max(0, Number(fieldValue(form, "delay")) || 0),
    risk: fieldValue(form, "risk"),
    agent: fieldValue(form, "agent"),
    status: fieldValue(form, "status"),
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

function bindEvents() {
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

  document.body.addEventListener("click", (event) => {
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
    if (reminderButton) registerReminder(reminderButton.dataset.reminder, reminderButton.dataset.channel || "call");
    if (reminderFormButton) openReminderForm(reminderFormButton.dataset.reminderForm, reminderFormButton.dataset.channel || "call");
    if (paymentFormButton) openPaymentForm(paymentFormButton.dataset.paymentForm);
    if (paymentFullButton) registerFullPayment(paymentFullButton.dataset.paymentFull);
    if (promiseFormButton) openPromiseForm(promiseFormButton.dataset.promiseForm);
    if (scenarioButton) applyScenario(Number(scenarioButton.dataset.scenario));
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
    if (!["caseForm", "reminderForm", "paymentForm", "promiseForm"].includes(event.target.id)) return;
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
  document.querySelector("#demoResetButton").addEventListener("click", resetDemo);
}

function init() {
  renderKpis();
  renderPriorityList();
  renderChart();
  renderChannels();
  renderAgentFilter();
  renderTable();
  renderRelances();
  renderPayments();
  renderReports();
  bindEvents();
}

init();
