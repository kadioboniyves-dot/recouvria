const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tableName = "app_state";
const stateKey = "recouvria-main";

function send(response, status, payload) {
  response.status(status).json(payload);
}

async function supabaseRequest(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json"
    }
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(payload?.message || payload?.error || `Supabase error ${response.status}`);
  return payload;
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");

  if (!supabaseUrl || !serviceRoleKey) {
    send(response, 200, { configured: false, case: null, orders: [] });
    return;
  }

  const dossier = String(request.query?.dossier || request.query?.case || "").trim();
  if (!dossier) {
    send(response, 400, { error: "Dossier requis" });
    return;
  }

  try {
    const rows = await supabaseRequest(`${tableName}?key=eq.${encodeURIComponent(stateKey)}&select=payload&limit=1`);
    const state = rows?.[0]?.payload || {};
    const target = (state.cases || []).find((item) => String(item.id).toLowerCase() === dossier.toLowerCase());
    if (!target) {
      send(response, 404, { configured: true, error: "Dossier introuvable", case: null, orders: [] });
      return;
    }
    const orders = (state.orders || []).filter((order) =>
      order.caseId === target.id || (!order.caseId && String(order.client).toLowerCase() === String(target.client).toLowerCase())
    );
    send(response, 200, { configured: true, case: target, orders });
  } catch (error) {
    send(response, 200, { configured: false, error: error.message, case: null, orders: [] });
  }
}
