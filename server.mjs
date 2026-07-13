import { createServer } from "node:http";
import { mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const dataDir = join(root, "data");
const dbPath = join(dataDir, "recouvria.sqlite");
const sessionDays = 7;

mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

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
    archived: false,
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
    archived: false,
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
    archived: false,
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
    archived: false,
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
    archived: false,
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
    archived: false,
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

const seedAgents = [
  { id: "AG-001", name: "Mariam Traore", email: "mariam.traore@recouvria.ci", phone: "+225 07 10 20 30 40", role: "Lead recouvrement", recovered: 14800000, target: 20000000, cases: 18, active: true },
  { id: "AG-002", name: "Jean Koffi", email: "jean.koffi@recouvria.ci", phone: "+225 05 44 22 10 20", role: "Chargé précontentieux", recovered: 11900000, target: 18000000, cases: 21, active: true },
  { id: "AG-003", name: "Prisca Toure", email: "prisca.toure@recouvria.ci", phone: "+225 01 88 73 40 12", role: "Chargée portefeuille", recovered: 9700000, target: 14000000, cases: 14, active: true }
];

const seedClients = seedCases.map((item, index) => ({
  id: `CL-${String(index + 1).padStart(3, "0")}`,
  name: item.client,
  contact: item.contact,
  phone: item.phone,
  email: item.email,
  segment: item.risk === "legal" ? "Précontentieux" : "B2B",
  notes: `Client suivi par ${item.agent}.`
}));

function migrate() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      email TEXT,
      phone TEXT,
      role TEXT,
      recovered INTEGER NOT NULL DEFAULT 0,
      target INTEGER NOT NULL DEFAULT 0,
      cases_count INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      contact TEXT,
      phone TEXT,
      email TEXT,
      segment TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      client TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      email TEXT,
      amount INTEGER NOT NULL DEFAULT 0,
      paid INTEGER NOT NULL DEFAULT 0,
      delay INTEGER NOT NULL DEFAULT 0,
      risk TEXT NOT NULL DEFAULT 'medium',
      agent TEXT,
      status TEXT NOT NULL DEFAULT 'Nouveau',
      next_action TEXT,
      next_date TEXT,
      promise TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      history_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_ref TEXT,
      client TEXT NOT NULL,
      product TEXT,
      packaging TEXT,
      quantity REAL NOT NULL DEFAULT 0,
      unit_price INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      date TEXT,
      status TEXT NOT NULL,
      case_id TEXT
    );
    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      client TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Brouillon',
      created_at TEXT NOT NULL
    );
  `);
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = hashPassword(password, salt).split(":")[1];
  return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
}

function count(table) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
}

function seed() {
  const now = new Date().toISOString();
  if (!count("users")) {
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run("Administrateur Recouvria", "admin@recouvria.local", hashPassword("recouvria2026"), "admin", now);
  }

  if (!count("agents")) seedAgents.forEach(upsertAgent);
  if (!count("clients")) seedClients.forEach(upsertClient);
  if (!count("cases")) seedCases.forEach(upsertCase);
  if (!count("orders")) seedOrders.forEach(upsertOrder);
}

function json(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  json(response, 404, { error: "Route introuvable" });
}

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => {
    const [name, ...value] = part.trim().split("=");
    return [name, decodeURIComponent(value.join("=") || "")];
  }).filter(([name]) => name));
}

function sessionCookie(value, maxAge = sessionDays * 24 * 60 * 60) {
  return `recouvria_session=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function hashSession(token) {
  return createHash("sha256").update(token).digest("hex");
}

function getSession(request) {
  const token = parseCookies(request.headers.cookie).recouvria_session;
  if (!token) return null;
  const session = db.prepare(`
    SELECT sessions.id, sessions.expires_at, users.id AS user_id, users.name, users.email, users.role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ?
  `).get(hashSession(token));

  if (!session) return null;
  if (Date.parse(session.expires_at) <= Date.now()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(session.id);
    return null;
  }

  return {
    token,
    user: {
      id: session.user_id,
      name: session.name,
      email: session.email,
      role: session.role
    }
  };
}

function createSession(userId) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expires = new Date(now.getTime() + sessionDays * 24 * 60 * 60 * 1000);
  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(hashSession(token), userId, expires.toISOString(), now.toISOString());
  return token;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf-8");
  if (!text) return {};
  return JSON.parse(text);
}

function caseFromRow(row) {
  return {
    id: row.id,
    client: row.client,
    contact: row.contact || "",
    phone: row.phone || "",
    email: row.email || "",
    amount: row.amount,
    paid: row.paid,
    delay: row.delay,
    risk: row.risk,
    agent: row.agent || "",
    status: row.status,
    nextAction: row.next_action || "",
    nextDate: row.next_date || "",
    promise: row.promise || "",
    archived: Boolean(row.archived),
    history: JSON.parse(row.history_json || "[]")
  };
}

function orderFromRow(row) {
  return {
    id: row.id,
    orderRef: row.order_ref || "",
    client: row.client,
    product: row.product || "",
    packaging: row.packaging || "Unité",
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
    date: row.date || "",
    status: row.status,
    caseId: row.case_id || ""
  };
}

function agentFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email || "",
    phone: row.phone || "",
    role: row.role || "",
    recovered: row.recovered,
    target: row.target,
    cases: row.cases_count,
    active: Boolean(row.active)
  };
}

function clientFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact || "",
    phone: row.phone || "",
    email: row.email || "",
    segment: row.segment || "",
    notes: row.notes || ""
  };
}

function letterFromRow(row) {
  return {
    id: row.id,
    caseId: row.case_id || "",
    client: row.client,
    subject: row.subject,
    type: row.type,
    content: row.content,
    status: row.status,
    createdAt: row.created_at
  };
}

function getBootstrap() {
  return {
    cases: db.prepare("SELECT * FROM cases ORDER BY updated_at DESC, id DESC").all().map(caseFromRow),
    orders: db.prepare("SELECT * FROM orders ORDER BY date DESC, id DESC").all().map(orderFromRow),
    agents: db.prepare("SELECT * FROM agents ORDER BY active DESC, name ASC").all().map(agentFromRow),
    clients: db.prepare("SELECT * FROM clients ORDER BY name ASC").all().map(clientFromRow),
    letters: db.prepare("SELECT * FROM letters ORDER BY created_at DESC").all().map(letterFromRow)
  };
}

function upsertCase(item) {
  db.prepare(`
    INSERT INTO cases (
      id, client, contact, phone, email, amount, paid, delay, risk, agent, status,
      next_action, next_date, promise, archived, history_json, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      client = excluded.client,
      contact = excluded.contact,
      phone = excluded.phone,
      email = excluded.email,
      amount = excluded.amount,
      paid = excluded.paid,
      delay = excluded.delay,
      risk = excluded.risk,
      agent = excluded.agent,
      status = excluded.status,
      next_action = excluded.next_action,
      next_date = excluded.next_date,
      promise = excluded.promise,
      archived = excluded.archived,
      history_json = excluded.history_json,
      updated_at = excluded.updated_at
  `).run(
    item.id,
    item.client || "",
    item.contact || "",
    item.phone || "",
    item.email || "",
    Number(item.amount) || 0,
    Number(item.paid) || 0,
    Number(item.delay) || 0,
    item.risk || "medium",
    item.agent || "",
    item.status || "Nouveau",
    item.nextAction || "",
    item.nextDate || "",
    item.promise || "",
    item.archived ? 1 : 0,
    JSON.stringify(item.history || []),
    new Date().toISOString()
  );
}

function upsertOrder(item) {
  db.prepare(`
    INSERT INTO orders (
      id, order_ref, client, product, packaging, quantity, unit_price, total, date, status, case_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      order_ref = excluded.order_ref,
      client = excluded.client,
      product = excluded.product,
      packaging = excluded.packaging,
      quantity = excluded.quantity,
      unit_price = excluded.unit_price,
      total = excluded.total,
      date = excluded.date,
      status = excluded.status,
      case_id = excluded.case_id
  `).run(
    item.id,
    item.orderRef || item.id,
    item.client || "",
    item.product || "",
    item.packaging || "Unité",
    Number(item.quantity) || 0,
    Number(item.unitPrice) || 0,
    Number(item.total) || 0,
    item.date || "",
    item.status || "Non payée",
    item.caseId || ""
  );
}

function upsertAgent(item) {
  db.prepare(`
    INSERT INTO agents (id, name, email, phone, role, recovered, target, cases_count, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      phone = excluded.phone,
      role = excluded.role,
      recovered = excluded.recovered,
      target = excluded.target,
      cases_count = excluded.cases_count,
      active = excluded.active
  `).run(
    item.id || agentId(item.name),
    item.name || "",
    item.email || "",
    item.phone || "",
    item.role || "",
    Number(item.recovered) || 0,
    Number(item.target) || 0,
    Number(item.cases) || 0,
    item.active === false ? 0 : 1
  );
}

function upsertClient(item) {
  db.prepare(`
    INSERT INTO clients (id, name, contact, phone, email, segment, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      contact = excluded.contact,
      phone = excluded.phone,
      email = excluded.email,
      segment = excluded.segment,
      notes = excluded.notes
  `).run(
    item.id || clientId(item.name),
    item.name || "",
    item.contact || "",
    item.phone || "",
    item.email || "",
    item.segment || "",
    item.notes || ""
  );
}

function upsertLetter(item) {
  db.prepare(`
    INSERT INTO letters (id, case_id, client, subject, type, content, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      case_id = excluded.case_id,
      client = excluded.client,
      subject = excluded.subject,
      type = excluded.type,
      content = excluded.content,
      status = excluded.status,
      created_at = excluded.created_at
  `).run(
    item.id,
    item.caseId || "",
    item.client || "",
    item.subject || "",
    item.type || "Relance",
    item.content || "",
    item.status || "Brouillon",
    item.createdAt || new Date().toISOString()
  );
}

function slug(value) {
  return String(value || "item")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "item";
}

function agentId(name) {
  return `AG-${slug(name).toUpperCase()}`;
}

function clientId(name) {
  return `CL-${slug(name).toUpperCase()}`;
}

function replaceTable(table, items, upsert) {
  db.exec("BEGIN");
  try {
    db.prepare(`DELETE FROM ${table}`).run();
    items.forEach(upsert);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function saveState(payload) {
  replaceTable("cases", Array.isArray(payload.cases) ? payload.cases : [], upsertCase);
  replaceTable("orders", Array.isArray(payload.orders) ? payload.orders : [], upsertOrder);
  replaceTable("agents", Array.isArray(payload.agents) ? payload.agents : [], upsertAgent);
  replaceTable("clients", Array.isArray(payload.clients) ? payload.clients : [], upsertClient);
  replaceTable("letters", Array.isArray(payload.letters) ? payload.letters : [], upsertLetter);
}

function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const routes = {
    "/": "/index.html",
    "/admin": "/index.html",
    "/administration": "/index.html",
    "/client": "/client.html"
  };
  const requested = routes[pathname] || pathname;
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/session" && request.method === "GET") {
    const session = getSession(request);
    if (!session) return json(response, 200, { authenticated: false });
    return json(response, 200, { authenticated: true, user: session.user });
  }

  if (pathname === "/api/login" && request.method === "POST") {
    const body = await readBody(request);
    const user = db.prepare("SELECT * FROM users WHERE lower(email) = lower(?)").get(body.email || "");
    if (!user || !verifyPassword(body.password || "", user.password_hash)) {
      return json(response, 401, { error: "Identifiants invalides" });
    }
    const token = createSession(user.id);
    return json(response, 200, {
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    }, { "Set-Cookie": sessionCookie(token) });
  }

  const session = getSession(request);
  if (!session) return json(response, 401, { error: "Authentification requise" });

  if (pathname === "/api/logout" && request.method === "POST") {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(hashSession(session.token));
    return json(response, 200, { ok: true }, { "Set-Cookie": sessionCookie("", 0) });
  }

  if (pathname === "/api/bootstrap" && request.method === "GET") {
    return json(response, 200, { user: session.user, ...getBootstrap() });
  }

  if (pathname === "/api/state" && (request.method === "PUT" || request.method === "POST")) {
    const body = await readBody(request);
    saveState(body);
    return json(response, 200, { ok: true, savedAt: new Date().toISOString() });
  }

  return notFound(response);
}

migrate();
seed();

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  if (url.pathname === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    try {
      await handleApi(request, response, url.pathname);
    } catch (error) {
      console.error(error);
      json(response, 500, { error: "Erreur serveur", detail: error.message });
    }
    return;
  }

  const filePath = resolvePath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Recouvria disponible sur http://${host}:${port}`);
  console.log("Connexion demo : admin@recouvria.local / recouvria2026");
});
