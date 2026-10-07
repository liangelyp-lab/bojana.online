import { ImapFlow } from "imapflow"
import { requireSupabaseUser } from "../_lib/auth"

function config() {
  const required = ["MAIL_HOST", "MAIL_PORT", "MAIL_USER", "MAIL_PASSWORD"] as const
  for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`)
  return {
    host: process.env.MAIL_HOST!,
    port: Number(process.env.MAIL_PORT),
    auth: { user: process.env.MAIL_USER!, pass: process.env.MAIL_PASSWORD! },
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" })
  if (!await requireSupabaseUser(req, res)) return
  const client = new ImapFlow({ ...config(), secure: true as const, logger: false as const })
  try {
    await client.connect()
    const lock = await client.getMailboxLock("INBOX")
    try {
      const messages = []
      for await (const message of client.fetch("*", { envelope: true, flags: true, source: false }, { uid: true })) {
        messages.push({
          uid: message.uid,
          subject: message.envelope?.subject || "(sin asunto)",
          from: message.envelope?.from?.[0]?.address || "",
          fromName: message.envelope?.from?.[0]?.name || "",
          date: message.envelope?.date || null,
          unread: !message.flags?.has("\\Seen"),
        })
      }
      return res.status(200).json({ messages: messages.reverse().slice(0, 100) })
    } finally {
      lock.release()
    }
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo leer el buzón" })
  } finally {
    await client.logout().catch(() => undefined)
  }
}
