const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminPassword = process.env.RECOUVRIA_ADMIN_PASSWORD || "recouvria2026";
const tableName = "app_state";
const stateKey = "recouvria-main";

function send(response, status, payload) {
  response.status(status).json(payload);
}

function isConfigured() {
  return Boolean(supabaseUrl && serviceRoleKey);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.message || payload?.error || `Supabase error ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function isAuthorized(request) {
  return request.headers["x-recouvria-admin-password"] === adminPassword;
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,x-recouvria-admin-password");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (!isConfigured()) {
    send(response, 200, { configured: false, error: "Supabase n'est pas configuré." });
    return;
  }

  try {
    if (request.method === "GET") {
      const rows = await supabaseRequest(`${tableName}?key=eq.${encodeURIComponent(stateKey)}&select=payload,updated_at&limit=1`);
      send(response, 200, { configured: true, state: rows?.[0]?.payload || null, updatedAt: rows?.[0]?.updated_at || null });
      return;
    }

    if (request.method === "PUT" || request.method === "POST") {
      if (!isAuthorized(request)) {
        send(response, 401, { configured: true, error: "Mot de passe admin requis." });
        return;
      }
      const row = { key: stateKey, payload: request.body || {}, updated_at: new Date().toISOString() };
      const rows = await supabaseRequest(tableName, {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(row)
      });
      send(response, 200, { configured: true, savedAt: rows?.[0]?.updated_at || row.updated_at });
      return;
    }

    send(response, 405, { error: "Méthode non autorisée" });
  } catch (error) {
    const missingTable = /relation .*app_state|schema cache|Could not find the table/i.test(error.message);
    send(response, missingTable ? 200 : 500, {
      configured: !missingTable,
      error: missingTable ? "La table Supabase app_state doit être créée." : error.message
    });
  }
}
