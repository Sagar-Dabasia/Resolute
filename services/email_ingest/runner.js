#!/usr/bin/env node
// Entry point. Two run modes:
//   node services/email_ingest/runner.js --once     one-shot (manual / cron)
//   node services/email_ingest/runner.js             loop every POLL_INTERVAL_SEC
// Wires the real deps (IMAP, LLM provider, Supabase store) into processMessage.
import { config } from './config.js'
import { getProvider } from './providers/index.js'
import { matchClientByEmail } from './clients.js'
import { isProcessed, markProcessed, enqueueReview, uploadPdfs, attachToOrder } from './store.js'
import { createInboundOrder } from '../../api/_lib/ordersRepo.js'
import { processMessage } from './ingest.js'
import { fetchUnread } from './mailbox.js'

const stamp = () => new Date().toISOString()
const log = (o) => console.log(`[ingest ${stamp()}]`, JSON.stringify(o))

function buildDeps() {
  const provider = getProvider(config.llm.provider)
  return {
    provider,
    matchClient: (sender) => matchClientByEmail(sender),
    isProcessed: (id) => isProcessed(id),
    markProcessed: (e) => markProcessed(e),
    createOrder: (fields, meta) => createInboundOrder(fields, meta),
    uploadPdfs: (id, pdfs) => uploadPdfs(id, pdfs),
    attachToOrder: (id, refs) => attachToOrder(id, refs),
    enqueueReview: (item) => enqueueReview(item),
    notify: (r) => log({ action: 'staff_flag', ...r }),
    log,
    confidenceThreshold: config.confidenceThreshold,
  }
}

export async function runOnce(deps = buildDeps()) {
  const messages = await fetchUnread()
  log({ action: 'poll', unread: messages.length, provider: config.llm.provider })
  const results = []
  for (const msg of messages) {
    try {
      results.push(await processMessage(msg, deps))
    } catch (err) {
      log({ action: 'error', messageId: msg.messageId, error: err?.message || String(err) })
      results.push({ action: 'error', error: err?.message })
    }
  }
  return results
}

async function loop() {
  const deps = buildDeps()
  log({ action: 'start', mode: 'loop', intervalSec: config.pollIntervalSec })
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try { await runOnce(deps) } catch (e) { log({ action: 'poll_error', error: e?.message }) }
    await new Promise(r => setTimeout(r, config.pollIntervalSec * 1000))
  }
}

// CLI dispatch (only when run directly, not when imported by tests).
const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const once = process.argv.includes('--once')
  ;(once ? runOnce().then(r => log({ action: 'done', processed: r.length })) : loop())
    .catch(err => { console.error('[ingest] fatal:', err); process.exit(1) })
}
