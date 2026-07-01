// Modular LLM extraction service. Pulls the four intake fields out of an
// inbound email (+ attachment text) using strict JSON structured output.
//
// Uses the Anthropic (Claude) Messages API with a forced tool call — Claude's
// mechanism for guaranteed, schema-valid JSON. Falls back to a lightweight
// regex heuristic when ANTHROPIC_API_KEY is absent, so the pipeline still runs
// locally without a key.

// Order types the app understands (mirrors the client "Place an Order" list).
export const ORDER_TYPES = [
  'Current Owner', 'Two-Owner', 'Full Search', 'Lien Search',
  'Tax Certificate', 'HOA Estoppel', 'Municipal Lien', 'Property Valuation',
]

const EXTRACT_TOOL = {
  name: 'extract_order',
  description: 'Extract structured title-order intake fields from an inbound client email and its attachments.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      propertyAddress: { type: ['string', 'null'], description: 'Full street address of the subject property, or null if not stated.' },
      parcelNumberAPN: { type: ['string', 'null'], description: "Parcel number / Assessor's Parcel Number (APN), or null." },
      borrowerName:    { type: ['string', 'null'], description: 'Borrower / buyer / owner name, or null.' },
      orderType:       { type: ['string', 'null'], enum: [...ORDER_TYPES, null], description: 'Requested search product; null if unclear.' },
    },
    required: ['propertyAddress', 'parcelNumberAPN', 'borrowerName', 'orderType'],
  },
}

const buildSourceText = ({ subject, from, text, attachments = [] }) => {
  const parts = []
  if (from) parts.push(`From: ${from}`)
  if (subject) parts.push(`Subject: ${subject}`)
  if (text) parts.push(`\nBody:\n${text}`)
  attachments.forEach((a, i) => {
    const body = a.text || a.content_text || ''
    parts.push(`\nAttachment ${i + 1} (${a.filename || a.name || 'file'}):\n${body || '[binary attachment — no extracted text provided]'}`)
  })
  return parts.join('\n').slice(0, 24000) // keep the prompt bounded
}

// Regex fallback used when no API key is configured.
function heuristicExtract(src) {
  const apn = src.match(/\b(?:APN|Parcel(?:\s*(?:No|Number|#))?)\s*[:#]?\s*([\w-]{5,})/i)
  const type = ORDER_TYPES.find(t => new RegExp(t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i').test(src))
  const borrower = src.match(/\b(?:borrower|buyer|owner|mortgagor)\s*[:]?\s*([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/)
  const addr = src.match(/\d{1,6}\s+[A-Za-z0-9.\s]+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Ct|Court|Way|Pl|Place|Ter|Terrace)\b[^\n,]*(?:,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})?/i)
  return {
    propertyAddress: addr ? addr[0].trim() : null,
    parcelNumberAPN: apn ? apn[1].trim() : null,
    borrowerName: borrower ? borrower[1].trim() : null,
    orderType: type || null,
  }
}

export async function extractOrderFields(email) {
  const src = buildSourceText(email)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { fields: heuristicExtract(src), method: 'heuristic' }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      max_tokens: 512,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_order' }, // force the structured output
      messages: [{
        role: 'user',
        content:
          'Extract the title-order intake fields from the following inbound client email and attachments. ' +
          'Use null for any field not clearly present. Do not guess.\n\n' + src,
      }],
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 300)}`)
  }
  const data = await res.json()
  const toolUse = (data.content || []).find(c => c.type === 'tool_use')
  if (!toolUse) throw new Error('No structured tool output returned by the model')
  const f = toolUse.input || {}
  return {
    method: 'llm',
    fields: {
      propertyAddress: f.propertyAddress ?? null,
      parcelNumberAPN: f.parcelNumberAPN ?? null,
      borrowerName: f.borrowerName ?? null,
      orderType: ORDER_TYPES.includes(f.orderType) ? f.orderType : null,
    },
  }
}
