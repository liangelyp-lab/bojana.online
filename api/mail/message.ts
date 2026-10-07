import { ImapFlow } from "imapflow"
import { simpleParser } from "mailparser"

function config() {
  return { host: process.env.MAIL_HOST!, port: Number(process.env.MAIL_PORT), secure: true, auth: { user: process.env.MAIL_USER!, pass: process.env.MAIL_PASSWORD! }, logger: false }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" })
  const uid = Number(req.query?.uid)
  if (!Number.isInteger(uid) || uid <= 0) return res.status(400).json({ message: "UID inválido" })
  const client = new ImapFlow(config())
  try {
    await client.connect()
    const lock = await client.getMailboxLock("INBOX")
    try {
      const message = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true })
      if (!message?.source) return res.status(404).json({ message: "Correo no encontrado" })
      const parsed = await simpleParser(message.source)
      return res.status(200).json({
        uid,
        subject: parsed.subject || "(sin asunto)",
        from: parsed.from?.text || "",
        date: parsed.date || null,
        text: parsed.text || "",
        html: typeof parsed.html === "string" ? parsed.html : "",
        attachments: parsed.attachments.map(file => ({ filename: file.filename, contentType: file.contentType, size: file.size })),
      })
    } finally { lock.release() }
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo abrir el correo" })
  } finally { await client.logout().catch(() => undefined) }
}
