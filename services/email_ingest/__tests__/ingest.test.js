// Unit tests for the ingest pipeline. Run: npm test
// Everything is mocked — no IMAP, Supabase, or real LLM calls.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateExtraction, SERVICE_CATALOG } from '../schema.js'
import { parseAddress, matchClientByEmail } from '../clients.js'
import { processMessage } from '../ingest.js'

// ── Fixtures / mock factory ──────────────────────────────────────────────────
const goodParse = {
  service_type: 'Full Search', property_address: '1 Main St', parcel_or_apn: 'APN-9',
  client_reference: 'LOAN-42', requested_turnaround: '48h', notes: null,
  confidence: 0.95, needs_review: false, review_reason: null,
}

function makeDeps(overrides = {}) {
  const calls = { created: [], queued: [], marked: [], uploaded: [], attached: [] }
  const deps = {
    provider: { extract_order: async () => ({ ...goodParse }) },
    matchClient: async () => ({ code: 'CL01', name: 'Acme Title', email: 'orders@acme.com' }),
    isProcessed: async () => false,
    markProcessed: async (e) => { calls.marked.push(e) },
    createOrder: async () => { const o = { id: 'RTS-20001' }; calls.created.push(o); return o },
    uploadPdfs: async (_id, pdfs) => { calls.uploaded.push(pdfs); return pdfs.map(p => ({ path: 'p', url: 'u', filename: p.filename })) },
    attachToOrder: async (id, refs) => { calls.attached.push({ id, refs }) },
    enqueueReview: async (item) => { calls.queued.push(item) },
    confidenceThreshold: 0.8,
    ...overrides,
  }
  return { deps, calls }
}
const msg = (extra = {}) => ({ messageId: 'm-1', sender: 'Acme <orders@acme.com>', subject: 'Order', text: 'Full Search please', attachments: [], ...extra })

// ── Schema validation ────────────────────────────────────────────────────────
test('validateExtraction fills all keys and clamps confidence', () => {
  const r = validateExtraction({ service_type: 'Full Search', confidence: 5 })
  assert.equal(r.confidence, 1)
  assert.equal(r.service_type, 'Full Search')
  assert.equal(r.needs_review, false)
  assert.equal(r.property_address, null)
})

test('validateExtraction rejects off-catalog service_type and forces review', () => {
  const r = validateExtraction({ service_type: 'Astrology Report', confidence: 0.9 })
  assert.equal(r.service_type, null)
  assert.equal(r.needs_review, true)
  assert.match(r.review_reason, /catalog/i)
})

test('validateExtraction throws on non-object', () => {
  assert.throws(() => validateExtraction(null))
})

test('SERVICE_CATALOG comes from the portal order types', () => {
  assert.ok(SERVICE_CATALOG.includes('Full Search'))
})

// ── Client matching ──────────────────────────────────────────────────────────
test('parseAddress extracts bare address from a display-name sender', () => {
  assert.equal(parseAddress('Jane Doe <Jane@Acme.com>'), 'jane@acme.com')
  assert.equal(parseAddress('bob@x.io'), 'bob@x.io')
})

test('matchClientByEmail returns the row on a case-insensitive hit', async () => {
  const fakeDb = { from: () => ({ select: () => ({ ilike: () => ({ limit: async () => ({ data: [{ code: 'CL01', email: 'orders@acme.com' }] }) }) }) }) }
  const row = await matchClientByEmail('Acme <ORDERS@acme.com>', fakeDb)
  assert.equal(row.code, 'CL01')
})

test('matchClientByEmail returns null when no client matches', async () => {
  const fakeDb = { from: () => ({ select: () => ({ ilike: () => ({ limit: async () => ({ data: [] }) }) }) }) }
  assert.equal(await matchClientByEmail('nobody@nowhere.com', fakeDb), null)
})

// ── Happy path: create order ─────────────────────────────────────────────────
test('creates an order when client matched + mapped + confident', async () => {
  const { deps, calls } = makeDeps()
  const r = await processMessage(msg(), deps)
  assert.equal(r.action, 'created')
  assert.equal(calls.created.length, 1)
  assert.equal(calls.marked[0].status, 'created')
})

test('uploads + attaches PDFs on create', async () => {
  const { deps, calls } = makeDeps()
  await processMessage(msg({ attachments: [{ filename: 'deed.pdf', mimeType: 'application/pdf', content: Buffer.from('x') }] }), deps)
  assert.equal(calls.uploaded.length, 1)
  assert.equal(calls.attached[0].id, 'RTS-20001')
})

// ── Confidence gating ────────────────────────────────────────────────────────
test('queues (never creates) when confidence below threshold', async () => {
  const { deps, calls } = makeDeps({ provider: { extract_order: async () => ({ ...goodParse, confidence: 0.5 }) } })
  const r = await processMessage(msg(), deps)
  assert.equal(r.action, 'queued')
  assert.equal(calls.created.length, 0)
  assert.match(r.reason, /confidence/)
  assert.equal(calls.marked[0].status, 'queued')
})

test('queues when service_type cannot be mapped', async () => {
  const { deps, calls } = makeDeps({ provider: { extract_order: async () => validateExtraction({ service_type: 'Bogus', confidence: 0.99 }) } })
  const r = await processMessage(msg(), deps)
  assert.equal(r.action, 'queued')
  assert.equal(calls.created.length, 0)
})

test('queues when sender is not a known client', async () => {
  const { deps, calls } = makeDeps({ matchClient: async () => null })
  const r = await processMessage(msg(), deps)
  assert.equal(r.action, 'queued')
  assert.match(r.reason, /not matched/)
  assert.equal(calls.queued[0].clientCode, null)
})

test('queues when the model flags needs_review even at high confidence', async () => {
  const { deps } = makeDeps({ provider: { extract_order: async () => ({ ...goodParse, needs_review: true, review_reason: 'ambiguous' }) } })
  const r = await processMessage(msg(), deps)
  assert.equal(r.action, 'queued')
})

test('extraction error is caught → queued, not thrown', async () => {
  const { deps, calls } = makeDeps({ provider: { extract_order: async () => { throw new Error('boom') } } })
  const r = await processMessage(msg(), deps)
  assert.equal(r.action, 'queued')
  assert.equal(calls.created.length, 0)
})

// ── Idempotency ──────────────────────────────────────────────────────────────
test('skips a Message-ID already in the ledger (no duplicate order)', async () => {
  const { deps, calls } = makeDeps({ isProcessed: async () => true })
  const r = await processMessage(msg(), deps)
  assert.equal(r.action, 'skipped')
  assert.equal(calls.created.length, 0)
  assert.equal(calls.queued.length, 0)
})
