"use server";

import { SITE } from "@/lib/site";

/**
 * Envía el formulario de contacto por Resend (https://resend.com):
 *  1. El mensaje llega al correo del equipo desde info@saicuma.org, con
 *     reply-to de quien escribió (responder en Gmail le contesta directo).
 *  2. Quien escribió recibe una confirmación desde info@saicuma.org; si la
 *     responde, info@ reenvía a Gmail (registros MX/TXT de Forward Email en el DNS).
 *
 * Variables de entorno (en Vercel):
 *   RESEND_API_KEY     clave de la API de Resend (obligatoria)
 *   CONTACT_TO         destino; por defecto enlamiracritica@gmail.com
 *   CONTACT_FROM       remitente; por defecto "SAICuMA <info@saicuma.org>"
 */

export type ContactField = "name" | "email" | "subject" | "message";

export type ContactState = {
  status: "idle" | "ok" | "error";
  message?: string;
  errors?: Partial<Record<ContactField, string>>;
  /** Lo que escribió la persona, para no perderlo si algo falla. */
  values?: Partial<Record<ContactField, string>>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const clean = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);

async function sendEmail(apiKey: string, payload: Record<string, unknown>) {
  // RESEND_API_URL sólo para pruebas locales; en producción usa la API real.
  const res = await fetch(process.env.RESEND_API_URL || "https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: clean(formData.get("your-name"), 120),
    email: clean(formData.get("your-email"), 200),
    subject: clean(formData.get("your-subject"), 200),
    message: clean(formData.get("your-message"), 8000),
  };

  // Campo trampa: las personas no lo ven; los robots suelen llenarlo.
  if (clean(formData.get("website"), 200)) {
    return { status: "ok", message: "¡Gracias! Recibimos tu mensaje." };
  }

  const errors: ContactState["errors"] = {};
  if (values.name.length < 2) errors.name = "Escribí tu nombre.";
  if (!EMAIL_RE.test(values.email)) errors.email = "Revisá el correo: así no podemos responderte.";
  if (values.message.length < 10) errors.message = "Contanos un poco más (al menos 10 caracteres).";
  if (Object.keys(errors).length) {
    return { status: "error", message: "Revisá los campos marcados.", errors, values };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contacto] Falta RESEND_API_KEY");
    return {
      status: "error",
      message: `No pudimos enviar el mensaje ahora. Escribinos directamente a ${SITE.email}.`,
      values,
    };
  }

  const to = process.env.CONTACT_TO || "enlamiracritica@gmail.com";
  const from = process.env.CONTACT_FROM || `${SITE.name} <info@saicuma.org>`;
  const site = SITE.url.replace(/^https?:\/\//, "");

  // 1) Mensaje para el equipo: todos los campos del formulario, uno por fila.
  const sentAt = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date());
  const fields: [string, string][] = [
    ["Nombre", values.name],
    ["Correo electrónico", values.email],
    ["Asunto", values.subject || "(sin asunto)"],
    ["Mensaje", values.message],
    ["Enviado", `${sentAt} · ${site}/contact`],
  ];
  const label = "font:600 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#888";
  const rows = fields
    .map(([k, v]) => {
      const value =
        k === "Correo electrónico"
          ? `<a href="mailto:${escapeHtml(v)}" style="color:#9e211d">${escapeHtml(v)}</a>`
          : escapeHtml(v);
      return `<tr>
<td style="padding:12px 16px 12px 0;vertical-align:top;white-space:nowrap;border-bottom:1px solid #eee;${label}">${k}</td>
<td style="padding:12px 0;vertical-align:top;border-bottom:1px solid #eee;white-space:pre-wrap">${value}</td>
</tr>`;
    })
    .join("");

  try {
    await sendEmail(apiKey, {
      from,
      to: [to],
      reply_to: values.email,
      subject: `[${SITE.name}] ${values.subject || `Mensaje de ${values.name}`}`,
      text: `Nuevo mensaje desde el formulario de contacto\n\n${fields
        .map(([k, v]) => (k === "Mensaje" ? `${k}:\n${v}\n` : `${k}: ${v}`))
        .join("\n")}\n\nRespondé este correo para contestarle directamente a ${values.name}.`,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#222;max-width:640px">
<p style="margin:0 0 16px;${label}">Nuevo mensaje desde el formulario de contacto</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border-top:1px solid #eee">${rows}</table>
<p style="margin:16px 0 0;font:12px/1.5 Helvetica,Arial,sans-serif;color:#999">Respondé este correo para contestarle directamente a ${escapeHtml(values.name)}.</p>
</div>`,
    });
  } catch (err) {
    console.error("[contacto] Error al enviar", err);
    return {
      status: "error",
      message: `No pudimos enviar el mensaje. Probá de nuevo en un rato o escribinos a ${SITE.email}.`,
      values,
    };
  }

  // 2) Confirmación para quien escribió. Si falla no importa: el mensaje ya llegó.
  await sendEmail(apiKey, {
    from,
    to: [values.email],
    subject: `Recibimos tu mensaje — ${SITE.name}`,
    text: `Hola ${values.name}:\n\nGracias por escribirnos. Recibimos tu mensaje y te vamos a responder pronto.\nSi querés agregar algo, respondé este correo.\n\n${SITE.name} · ${SITE.longName}\n${site}\n\n— Tu mensaje —\n${values.message}`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#222;max-width:560px">
<p style="margin:0 0 16px">Hola ${escapeHtml(values.name)}:</p>
<p style="margin:0 0 16px">Gracias por escribirnos. Recibimos tu mensaje y te vamos a responder pronto. Si querés agregar algo, respondé este correo.</p>
<p style="margin:0 0 24px"><strong>${SITE.name}</strong> · ${escapeHtml(SITE.longName)}<br><a href="${escapeHtml(SITE.url)}" style="color:#9e211d">${escapeHtml(site)}</a></p>
<div style="border-left:3px solid #e9e9e9;padding:4px 0 4px 16px;color:#666;font-size:15px;white-space:pre-wrap">${escapeHtml(values.message)}</div>
</div>`,
  }).catch((err) => console.error("[contacto] No se pudo enviar la confirmación", err));

  return {
    status: "ok",
    message: "Recibimos tu mensaje. Te mandamos una confirmación por correo y te vamos a responder pronto.",
  };
}
