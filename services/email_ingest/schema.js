// The one extraction schema both LLM providers must return, plus a validator.
// Kept dependency-free (no ajv) so tests need no install.
import { ORDER_TYPES } from '../../api/_lib/extractOrder.js'

// The portal's real service catalog — the only values service_type may map to.
export const SERVICE_CATALOG = ORDER_TYPES

// Fields returned by extract_order(). All keys are always present.
export const EXTRACTION_KEYS = [
  'service_type', 'property_address', 'parcel_or_apn', 'client_reference',
  'requested_turnaround', 'notes', 'confidence', 'needs_review', 'review_reason',
]

// Normalize + validate a raw provider object into the strict schema. Throws on
// structurally invalid input; otherwise returns a fully-populated, typed object.
// service_type that isn't in the catalog is nulled and forces needs_review.
export function validateExtraction(raw) {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('extraction result is not an object')
  }
  const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)

  let confidence = Number(raw.confidence)
  if (!Number.isFinite(confidence)) confidence = 0
  confidence = Math.min(1, Math.max(0, confidence))

  let service = str(raw.service_type)
  if (service && !SERVICE_CATALOG.includes(service)) service = null

  let needsReview = raw.needs_review === true
  let reason = str(raw.review_reason)
  if (!service) {
    needsReview = true
    reason = reason || 'service_type could not be mapped to the service catalog'
  }

  return {
    service_type: service,
    property_address: str(raw.property_address),
    parcel_or_apn: str(raw.parcel_or_apn),
    client_reference: str(raw.client_reference),
    requested_turnaround: str(raw.requested_turnaround),
    notes: str(raw.notes),
    confidence,
    needs_review: needsReview,
    review_reason: reason,
  }
}

// Prompt text shared by both providers. Catalog is injected so the model can
// only choose real service values.
export function buildInstruction(catalog = SERVICE_CATALOG) {
  return [
    'You extract title-search order details from an inbound client email and its PDF attachments.',
    'Return ONLY JSON matching this shape:',
    '{ "service_type": string|null, "property_address": string|null, "parcel_or_apn": string|null,',
    '  "client_reference": string|null, "requested_turnaround": string|null, "notes": string|null,',
    '  "confidence": number (0..1), "needs_review": boolean, "review_reason": string|null }',
    `service_type MUST be exactly one of: ${catalog.join(', ')}.`,
    'If you cannot confidently map the requested product to that list, set service_type=null, needs_review=true,',
    'and explain in review_reason. Use null for any field not clearly stated. Do not guess. confidence reflects',
    'your overall certainty that this is a complete, actionable order.',
  ].join('\n')
}
