// IMAP mailbox reader. Fetches UNSEEN messages from the configured folder and
// yields normalized { messageId, sender, subject, text, attachments[] } objects.
// Uses imapflow + mailparser (lazy-imported so tests/other modules don't need
// them installed). Marks messages \Seen after a successful read; true dedup is
// handled by the Message-ID ledger in store.js.
import { config } from './config.js'

export async function fetchUnread({ markSeen = true } = {}) {
  const { ImapFlow } = await import('imapflow')
  const { simpleParser } = await import('mailparser')

  const c = config.imap
  const client = new ImapFlow({
    host: c.host, port: c.port, secure: c.secure,
    auth: { user: c.user, pass: c.pass }, logger: false,
  })
  const messages = []
  await client.connect()
  const lock = await client.getMailboxLock(c.folder)
  try {
    for await (const m of client.fetch({ seen: false }, { source: true, uid: true })) {
      const parsed = await simpleParser(m.source)
      const attachments = (parsed.attachments || []).map(a => ({
        filename: a.filename || 'attachment',
        mimeType: a.contentType || 'application/octet-stream',
        content: a.content,                       // Buffer
      }))
      messages.push({
        uid: m.uid,
        messageId: parsed.messageId || `uid-${c.user}-${m.uid}`,
        sender: parsed.from?.text || '',
        subject: parsed.subject || '',
        text: parsed.text || parsed.html || '',
        attachments,
      })
    }
    if (markSeen && messages.length) {
      await client.messageFlagsAdd({ uid: messages.map(m => m.uid).join(',') }, ['\\Seen'], { uid: true })
    }
  } finally {
    lock.release()
    await client.logout()
  }
  return messages
}
