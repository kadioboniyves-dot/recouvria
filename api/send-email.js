const resendApiKey = process.env.RESEND_API_KEY;
const adminPassword = process.env.RECOUVRIA_ADMIN_PASSWORD || "recouvria2026";
const defaultFrom = "Recouvria KFN Pharma <onboarding@resend.dev>";
const fromEmail = process.env.RESEND_FROM_EMAIL || defaultFrom;

function send(response, status, payload) {
  response.status(status).json(payload);
}

function isAuthorized(request) {
  return request.headers["x-recouvria-admin-password"] === adminPassword;
}

function normalizeBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(text) {
  return `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
}

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,x-recouvria-admin-password");

  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    send(response, 405, { error: "Méthode non autorisée" });
    return;
  }

  if (!isAuthorized(request)) {
    send(response, 401, { error: "Mot de passe admin requis." });
    return;
  }

  if (!resendApiKey) {
    send(response, 200, {
      configured: false,
      error: "RESEND_API_KEY n'est pas configuré dans Vercel."
    });
    return;
  }

  const body = normalizeBody(request.body);
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").trim();
  const text = String(body.text || "").trim();

  if (!to || !subject || !text) {
    send(response, 400, { configured: true, error: "Destinataire, sujet et message sont requis." });
    return;
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        text,
        html: body.html || textToHtml(text)
      })
    });

    const payload = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      const message = payload?.message || payload?.error || `Erreur Resend ${resendResponse.status}`;
      send(response, 502, { configured: true, error: message });
      return;
    }

    send(response, 200, { configured: true, id: payload.id || null });
  } catch (error) {
    send(response, 500, { configured: true, error: error.message });
  }
}
