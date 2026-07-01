// POST /api/webhooks/inbound-email
// Inbound email → draft order pipeline.
// Accepts an inbound-email JSON payload (text + attachments), extracts the
// intake fields via the LLM service, and creates a draft order.
//
// Vercel serverless function (Node). The SPA rewrite in vercel.json excludes
// /api, so this route resolves to the function, not index.html.
import { extractOrderFields } from '../_lib/extractOrder.js'
import { createInboundOrder } from '../_lib/ordersRepo.js'
import { hasSupabaseAdmin } from '../_lib/supabaseAdmin.js'

// Normalize the many inbound-email provider shapes (SendGrid/Postmark/Mailgun/
// custom) into { from, subject, text, attachments }.
function normalize(body = {}) {
  const text =
    body.text || body['text'] || body.plain || body['body-plain'] ||
    body.TextBody || body.stripped_text || body.bodyPlain || ''
  const subject = body.subject || body.Subject || ''
  const from = body.from || body.From || body.sender || ''
  let attachments = body.attachments || body.Attachments || []
  if (!Array.isArray(attachments)) attachments = []
  return { from, subject, text, attachments }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional shared-secret check (set INBOUND_WEBHOOK_SECRET to enable).
  const secret = process.env.INBOUND_WEBHOOK_SECRET
  if (secret && req.headers['x-webhook-secret'] !== secret) {
    return res.status(401).json({ error: 'Invalid webhook secret' })
  }

  let email
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    email = normalize(body)
  } catch {
    return res.status(400).json({ error: 'Malformed JSON payload' })
  }

  if (!email.text && (!email.attachments || email.attachments.length === 0)) {
    // Nothing to parse — acknowledge so the provider doesn't retry.
    return res.status(200).json({ received: true, skipped: 'no email content' })
  }

  // Extract + persist. We acknowledge with 200 even if a downstream step fails
  // (logged server-side) so the email provider treats the message as received
  // and does not retry-storm. For true fire-and-forget, move this behind a
  // queue (e.g. Supabase queue / QStash) or Vercel waitUntil.
  try {
    if (!hasSupabaseAdmin) throw new Error('Supabase admin not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    const { fields, method } = await extractOrderFields(email)
    const order = await createInboundOrder(fields, { from: email.from, subject: email.subject })
    return res.status(200).json({ received: true, orderId: order.id, status: order.status, extraction: method, fields })
  } catch (err) {
    console.error('[inbound-email] processing error:', err?.message || err)
    return res.status(200).json({ received: true, processed: false, error: 'processing_failed' })
  }
}
