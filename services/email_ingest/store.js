// Persistence for the ingest pipeline: idempotency ledger (email_ingest_log),
// review queue (email_review_queue), and PDF attachment upload (same Storage
// bucket + path convention the portal uses: documents/orders/<id>/<file>).
import { supabaseAdmin } from '../../api/_lib/supabaseAdmin.js'

const db = () => {
  if (!supabaseAdmin) throw new Error('Supabase admin not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  return supabaseAdmin
}

// Idempotency: has this Message-ID already been handled?
export async function isProcessed(messageId, client = db()) {
  if (!messageId) return false
  const { data, error } = await client.from('email_ingest_log').select('message_id').eq('message_id', messageId).maybeSingle()
  if (error) throw new Error(`ingest-log read failed: ${error.message}`)
  return Boolean(data)
}

export async function markProcessed(entry, client = db()) {
  const { error } = await client.from('email_ingest_log').upsert({
    message_id: entry.messageId,
    sender: entry.sender ?? null,
    subject: entry.subject ?? null,
    status: entry.status,               // created | queued | skipped
    order_id: entry.orderId ?? null,
    review_reason: entry.reviewReason ?? null,
    processed_at: new Date().toISOString(),
  }, { onConflict: 'message_id' })
  if (error) throw new Error(`ingest-log write failed: ${error.message}`)
}

export async function enqueueReview(item, client = db()) {
  const { error } = await client.from('email_review_queue').insert({
    message_id: item.messageId,
    sender: item.sender ?? null,
    subject: item.subject ?? null,
    client_code: item.clientCode ?? null,
    parsed: item.parsed ?? {},
    attachments: item.attachments ?? [],
    review_reason: item.reviewReason ?? null,
  })
  if (error) throw new Error(`review-queue write failed: ${error.message}`)
}

// Upload PDFs to the documents bucket the same way the portal does, and return
// [{ path, url, filename }] refs to stash on the order / review row.
export async function uploadPdfs(orderOrMsgId, pdfFiles = [], client = db()) {
  const refs = []
  for (const f of pdfFiles) {
    const buf = Buffer.isBuffer(f.content) ? f.content : Buffer.from(f.content || '', 'base64')
    const safe = (f.filename || 'attachment.pdf').replace(/[^\w.\-]+/g, '_')
    const path = `orders/${orderOrMsgId}/${Date.now()}-${safe}`
    const up = await client.storage.from('documents').upload(path, buf, { contentType: f.mimeType || 'application/pdf' })
    if (up.error) throw new Error(`attachment upload failed: ${up.error.message}`)
    const signed = await client.storage.from('documents').createSignedUrl(path, 3600)
    refs.push({ path, url: signed.data?.signedUrl || null, filename: f.filename || safe })
  }
  return refs
}

// Attach uploaded refs onto the order's workflow (inboundAttachments[]).
export async function attachToOrder(orderId, refs, client = db()) {
  const { data, error } = await client.from('orders').select('workflow').eq('id', orderId).single()
  if (error) throw new Error(`order read failed: ${error.message}`)
  const workflow = { ...(data.workflow || {}) }
  workflow.inboundAttachments = [...(workflow.inboundAttachments || []), ...refs]
  const up = await client.from('orders').update({ workflow }).eq('id', orderId)
  if (up.error) throw new Error(`order attach failed: ${up.error.message}`)
}
