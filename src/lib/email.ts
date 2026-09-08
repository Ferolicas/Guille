import { Resend } from "resend";
import { attachmentData, type StoredUpload } from "@/lib/storage";

type MailAttachment = { filename: string; fileblob: string; mimetype: string };

type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

type Smtp2GoResponse = {
  data?: { succeeded?: number; failed?: number; failures?: unknown[] };
};

export type LeadForEmail = {
  name: string;
  phone: string;
  email: string;
  city: string | null;
  service: string;
  message: string;
};

function escapeHtml(value: string) {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  };
  return value.replace(/[&<>'"]/g, (char) => replacements[char] ?? char);
}

function fromAddress() {
  const configured = process.env.CONTACT_FROM_EMAIL?.trim() || "contacto@guilloguambi.com";
  return configured.includes("<") ? configured : `Guillo Guambi <${configured}>`;
}

function emailFrame(preheader: string, title: string, content: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#e9e6dc;font-family:Arial,sans-serif;color:#151512"><span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e9e6dc;padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffef8;border:1px solid #d8d4c7"><tr><td style="padding:22px 26px;background:#151512;color:#fff"><div style="font-size:20px;font-weight:800;letter-spacing:.12em"><span style="color:#f26a2e">G</span> GUILLO</div><div style="margin-top:5px;font-size:10px;letter-spacing:.14em;color:#b9b7b0">GUAMBI · REFORMAS</div></td></tr><tr><td style="padding:30px 26px"><div style="margin-bottom:12px;color:#d84f18;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Reformas y restauración · Barcelona</div><h1 style="margin:0 0 20px;font-size:29px;line-height:1.1;letter-spacing:-.03em">${escapeHtml(title)}</h1>${content}</td></tr><tr><td style="padding:18px 26px;border-top:1px solid #dedbd2;color:#6b6961;font-size:11px;line-height:1.5">Guillo Guambi · Barcelona y área metropolitana<br>Este correo corresponde a una solicitud realizada en guilloguambi.com.</td></tr></table></td></tr></table></body></html>`;
}

export async function sendTransactionalEmail(message: MailMessage) {
  const smtp2goKey = process.env.SMTP2GO_API_KEY?.trim();
  if (smtp2goKey) {
    const response = await fetch(process.env.SMTP2GO_API_URL || "https://eu-api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Smtp2go-Api-Key": smtp2goKey,
      },
      body: JSON.stringify({
        sender: fromAddress(),
        to: [message.to],
        subject: message.subject,
        html_body: message.html,
        text_body: message.text,
        custom_headers: message.replyTo ? [{ header: "Reply-To", value: message.replyTo }] : undefined,
        attachments: message.attachments,
        fastaccept: true,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as Smtp2GoResponse;
    if (!response.ok || result.data?.failed) {
      throw new Error(`SMTP2GO rechazó el correo (${response.status}).`);
    }
    return "smtp2go" as const;
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(attachment.fileblob, "base64"),
      })),
    });
    if (error) throw new Error(`Resend rechazó el correo: ${error.name}.`);
    return "resend" as const;
  }

  throw new Error("El proveedor de correo todavía no está configurado.");
}

export async function sendLeadEmails(lead: LeadForEmail, files: StoredUpload[]) {
  const ownerEmail = process.env.CONTACT_TO_EMAIL?.trim() || "guilloguambi@gmail.com";
  const { attachments, attachedCount } = await attachmentData(files);
  const fileNotice = files.length
    ? attachedCount === files.length
      ? `<p style="margin:18px 0;padding:13px 15px;background:#f2f0e9;border-left:3px solid #f26a2e;font-size:13px">Se adjuntan ${files.length} archivo${files.length === 1 ? "" : "s"} ya comprimido${files.length === 1 ? "" : "s"}.</p>`
      : `<p style="margin:18px 0;padding:13px 15px;background:#f2f0e9;border-left:3px solid #f26a2e;font-size:13px">Se adjuntan ${attachedCount} de ${files.length} archivos. El resto quedó guardado de forma privada y está disponible en el panel.</p>`
    : "";

  const ownerContent = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.6"><tr><td style="padding:7px 0;color:#696961">Nombre</td><td style="padding:7px 0;font-weight:700">${escapeHtml(lead.name)}</td></tr><tr><td style="padding:7px 0;color:#696961">Teléfono</td><td style="padding:7px 0;font-weight:700">${escapeHtml(lead.phone)}</td></tr><tr><td style="padding:7px 0;color:#696961">Email</td><td style="padding:7px 0;font-weight:700">${escapeHtml(lead.email)}</td></tr><tr><td style="padding:7px 0;color:#696961">Población</td><td style="padding:7px 0;font-weight:700">${escapeHtml(lead.city || "—")}</td></tr><tr><td style="padding:7px 0;color:#696961">Necesidad</td><td style="padding:7px 0;font-weight:700">${escapeHtml(lead.service)}</td></tr></table><h2 style="margin:24px 0 8px;font-size:17px">El proyecto</h2><p style="margin:0;white-space:pre-line;font-size:14px;line-height:1.65">${escapeHtml(lead.message)}</p>${fileNotice}`;
  const clientContent = `<p style="margin:0 0 16px;font-size:15px;line-height:1.65">Hola ${escapeHtml(lead.name)}, hemos recibido tu solicitud sobre <strong>${escapeHtml(lead.service)}</strong>.</p><p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#55544e">Revisaremos la información y te contactaremos para entender bien el espacio antes de preparar una valoración.</p>${files.length ? `<p style="margin:0;padding:13px 15px;background:#f2f0e9;border-left:3px solid #f26a2e;font-size:13px">También hemos recibido ${files.length} archivo${files.length === 1 ? "" : "s"} con tu solicitud.</p>` : ""}`;

  const results = await Promise.allSettled([
    sendTransactionalEmail({
      to: ownerEmail,
      replyTo: lead.email,
      subject: `Nueva solicitud · ${lead.service}`,
      html: emailFrame(`Nueva solicitud de ${lead.name}`, "Nueva solicitud de valoración", ownerContent),
      text: `Nueva solicitud\nNombre: ${lead.name}\nTeléfono: ${lead.phone}\nEmail: ${lead.email}\nPoblación: ${lead.city || "—"}\nServicio: ${lead.service}\n\n${lead.message}`,
      attachments,
    }),
    sendTransactionalEmail({
      to: lead.email,
      subject: "Hemos recibido tu solicitud · Guillo Guambi",
      html: emailFrame("Tu solicitud ya está con Guillo", "Tu solicitud ya está en buenas manos", clientContent),
      text: `Hola ${lead.name}, hemos recibido tu solicitud sobre ${lead.service}. Revisaremos la información y te contactaremos para entender bien el espacio.`,
      attachments,
    }),
  ]);

  results.forEach((result, index) => {
    if (result.status === "rejected") console.error(index === 0 ? "Fallo en aviso interno" : "Fallo en confirmación al cliente", result.reason);
  });
  return { ownerSent: results[0]?.status === "fulfilled", clientSent: results[1]?.status === "fulfilled" };
}

export function passwordResetEmail(resetUrl: string) {
  const content = `<p style="margin:0 0 18px;font-size:15px;line-height:1.65">Se ha solicitado cambiar la contraseña del panel privado de Guillo Guambi.</p><p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#55544e">El enlace caduca en 30 minutos y solo puede usarse una vez. Si no has sido tú, puedes ignorar este correo.</p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:15px 20px;background:#f26a2e;color:#fff;text-decoration:none;font-size:14px;font-weight:700">Crear contraseña nueva</a>`;
  return {
    subject: "Restablecer contraseña · Guillo Guambi",
    html: emailFrame("Enlace seguro para restablecer la contraseña", "Crea una contraseña nueva", content),
    text: `Abre este enlace para crear una contraseña nueva. Caduca en 30 minutos: ${resetUrl}`,
  };
}
