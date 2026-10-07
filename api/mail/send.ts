import nodemailer from "nodemailer"

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" })
  const { to, subject, text, inReplyTo } = req.body || {}
  if (!to || !subject || !text) return res.status(400).json({ message: "to, subject y text son obligatorios" })
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD },
    })
    const info = await transport.sendMail({
      from: process.env.MAIL_USER,
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
