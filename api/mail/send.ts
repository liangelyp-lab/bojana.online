import nodemailer from "nodemailer"
import { requireStudioRole } from "../_lib/auth.js"

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" })
  if (!await requireStudioRole(req, res, ['owner', 'admin', 'team'])) return
  const { to, subject, text, inReplyTo } = req.body || {}
  if (!to || !subject || !text) return res.status(400).json({ message: "to, subject y text son obligatorios" })
  try {
    const host = String(process.env.SMTP_HOST || "").trim()
    const user = String(process.env.MAIL_USER || "").trim()
    const password = String(process.env.MAIL_PASSWORD || "")
    const port = Number(process.env.SMTP_PORT || 465)
    const secure = process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465

    if (!host || !user || !password || !Number.isFinite(port)) {
      return res.status(503).json({ message: "El servicio de correo no está configurado en el servidor" })
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: { user, pass: password },
    })
    const info = await transport.sendMail({
      from: user,
      to,
      subject,
      text,
      ...(inReplyTo ? { inReplyTo, references: inReplyTo } : {}),
    })
    return res.status(200).json({ ok: true, messageId: info.messageId })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo enviar el correo" })
  }
}
