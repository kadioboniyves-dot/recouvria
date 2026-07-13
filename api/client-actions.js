const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tableName = "client_requests";

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
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = payload?.message || payload?.error || `Supabase error ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (!isConfigured()) {
    send(response, request.method === "GET" ? 200 : 503, {
      configured: false,
      error: "Supabase n'est pas configuré. Ajoute SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Vercel."
    });
    return;
  }

  try {
    if (request.method === "GET") {
      const rows = await supabaseRequest(`${tableName}?select=*&order=created_at.desc`);
      send(response, 200, { configured: true, requests: rows });
      return;
    }

    if (request.method === "POST") {
      const body = request.body || {};
      const row = {
        client_name: body.clientName || "Clinique Saint Gabriel",
        client_email: body.clientEmail || "client@kfnpharma.local",
        case_id: body.caseId || "RC-2026-0148",
        action_type: body.actionType || "message",
        message: body.message || "",
        amount: body.amount || 6600000,
        status: "nouveau"
      };
      const rows = await supabaseRequest(tableName, {
        method: "POST",
        body: JSON.stringify(row)
      });
      send(response, 201, { configured: true, request: rows?.[0] || row });
      return;
    }

    if (request.method === "PATCH") {
      const body = request.body || {};
      if (!body.id) {
        send(response, 400, { error: "Identifiant requis" });
        return;
      }
      const rows = await supabaseRequest(`${tableName}?id=eq.${encodeURIComponent(body.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: body.status || "traité",
          updated_at: new Date().toISOString()
        })
      });
      send(response, 200, { configured: true, request: rows?.[0] || null });
      return;
    }

    send(response, 405, { error: "Méthode non autorisée" });
  } catch (error) {
    send(response, 500, { configured: true, error: error.message });
  }
}
