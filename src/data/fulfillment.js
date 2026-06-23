// ─────────────────────────────────────────────────────────────────────────
// Typer fulfillment — data model, default seeds, and clause generators.
// Mock persistence only (no backend). Shapes follow the build spec §2.7.
// ─────────────────────────────────────────────────────────────────────────

export const uid = () => Math.random().toString(36).slice(2, 9)

// ── Date helpers ───────────────────────────────────────────────────────────
// Inputs store ISO (yyyy-mm-dd); generated clauses render MM/DD/YYYY.
export const fmtDate = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  if (!y || !m || !d) return iso
  return `${m}/${d}/${y}`
}
export const fmtDateTime = (iso) => {
  if (!iso) return ''
  const dt = new Date(iso)
  if (isNaN(dt)) return iso
  return dt.toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}
export const fmtMoney = (n) => {
  const num = Number(n)
  if (isNaN(num)) return '$0.00'
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// Placeholder token used inside generated clauses for empty values.
const tok = (label) => `‹${label}›`               // ‹label›
const v   = (val, label) => (val != null && String(val).trim() !== '' ? String(val) : tok(label))
const vd  = (iso, label) => (iso ? fmtDate(iso) : tok(label))
const va  = (amt, label) => (amt != null && String(amt).trim() !== '' ? fmtMoney(amt) : tok(label))

// ── Record factories ─────────────────────────────────────────────────────
export const makeDeed = () => ({
  id: uid(),
  grantor: '', grantee: '',
  dateOfDeed: '', recordedDate: '',
  book: '', page: '', instrument: '',
  certOfTitle: '', documentNo: '',
})

export const emptyLien = (county = '') => ({
  lender: '', mortgagor: '',
  dateOfMortgage: '', dateRecorded: '',
  amount: '', instrument: '',
  book: '', page: '',
  certOfTitle: '', docNo: '',
  hyperlink: '',
  county,
  assignments: [],     // { id, text }
  subordinations: [],  // { id, text }
})

// Label for a deed tab by its index — first is always "Vesting".
export const deedLabel = (i) => (i === 0 ? 'Vesting' : `#${i + 1}`)

// ── Clause generators ──────────────────────────────────────────────────────
// Mortgage clause — fixed language (§2.9), only bracketed values vary.
export function mortgageClause(lien = {}) {
  let s =
    `A mortgage by ${v(lien.mortgagor, 'mortgagor')} to ${v(lien.lender, 'lender')} ` +
    `dated ${vd(lien.dateOfMortgage, 'date of mortgage')} in the original principal amount of ` +
    `${va(lien.amount, 'amount')} and recorded on ${vd(lien.dateRecorded, 'date recorded')} ` +
    `in Book ${v(lien.book, 'book')}, Page ${v(lien.page, 'page')} in the official records of ` +
    `${v(lien.county, 'county')} County Register of Deeds, to be paid with proceeds of loan and released.`
  const asg = (lien.assignments || []).filter(a => a.text && a.text.trim())
  const sub = (lien.subordinations || []).filter(a => a.text && a.text.trim())
  asg.forEach(a => { s += ` ${a.text.trim().replace(/\.?$/, '.')}` })
  sub.forEach(a => { s += ` ${a.text.trim().replace(/\.?$/, '.')}` })
  return s
}

export function platmapsClause(maps = []) {
  const head = 'Any rights, easements, interests, or claims that may exist by reason of or be ' +
    'reflected by the facts shown on the following Plat Maps:'
  if (!maps.length) return `${head}\n  • ${tok('no plat maps added')}`
  const lines = maps.map(m =>
    `  • Plat Map recorded on ${vd(m.date, 'date')} in Book ${v(m.book, 'book')}, Page ${v(m.page, 'page')}.`
  )
  return `${head}\n${lines.join('\n')}`
}

export const easementClause = (e = {}) =>
  `Subject to the Easement recorded on ${vd(e.recordedDate, 'date')} in Book ${v(e.book, 'book')}, Page ${v(e.page, 'page')}.`

export const surveyClause = (s = {}) => {
  const by = s.surveyor ? ` made by ${s.surveyor}` : ''
  const on = s.surveyDate ? ` dated ${vd(s.surveyDate)}` : ''
  return `Facts disclosed by survey${by}${on}: ${s.encroachmentDescription || tok('encroachment description')}`
}

// Title Vesting auto-text from the Vesting deed (§2.4 item 4).
export function titleVestingAuto(deed = {}, county = '') {
  if (!deed.grantee && !deed.book && !deed.dateOfDeed) return ''
  return `${v(deed.grantee, 'owner')}, heirs and assigns forever by deed dated ` +
    `${vd(deed.dateOfDeed, 'date')} and recorded with ${county || tok('county')} County Register of Deeds on ` +
    `${vd(deed.recordedDate, 'recorded date')} in Book ${v(deed.book, 'book')}, Page ${v(deed.page, 'page')}.`
}

// Resolve the display/stored text for a requirement or exception row.
export function requirementText(req) {
  if (req.overridden) return req.overrideText
  if (req.kind === 'mortgage') return mortgageClause(req.lien)
  return req.text || ''
}
export function exceptionText(ex) {
  if (ex.overridden) return ex.overrideText
  switch (ex.kind) {
    case 'survey':   return surveyClause(ex)
    case 'platmaps': return platmapsClause(ex.maps)
    case 'easement': return easementClause(ex)
    default:         return ex.text || ''
  }
}

// ── Default seeds (Schedule B-I / B-II, paraphrased per spec) ────────────────
function defaultRequirements({ buyer, seller, county }) {
  return [
    { id: uid(), kind: 'text', text:
      'The Proposed Insured must notify the Company in writing of any party not referred to in this ' +
      'Commitment who will obtain an interest in the Land or make a loan on it; the Company may then ' +
      'make additional Requirements or Exceptions.' },
    { id: uid(), kind: 'text', text: 'Pay the agreed amount for the estate or interest to be insured.' },
    { id: uid(), kind: 'text', text: 'Pay the premiums, fees, and charges for the Policy to the Company.' },
    { id: uid(), kind: 'text', text:
      'Documents satisfactory to the Company that convey the Title or create the Mortgage to be insured ' +
      'must be properly authorized, executed, delivered, and recorded in the Public Records.\n' +
      `    Duly authorized and executed Deed from ${seller} to ${buyer} to be executed and recorded at closing.` },
    { id: uid(), kind: 'mortgage', lien: emptyLien(county), overridden: false, overrideText: '' },
    { id: uid(), kind: 'text', text:
      `Release of the Lis Pendens filed on ${tok('date')} as in No. ${tok('number')} at or before closing.` },
  ]
}

function defaultExceptions() {
  return [
    { id: uid(), kind: 'text', text:
      'Any defect, lien, encumbrance, adverse claim, or other matter that first appears in the Public ' +
      'Records or is created, attaches, or is disclosed between the Commitment Date and the date on which ' +
      'all of the Schedule B, Part I-Requirements are met.' },
    { id: uid(), kind: 'platmaps', maps: [], overridden: false, overrideText: '' },
    { id: uid(), kind: 'easement', recordedDate: '', book: '', page: '', overridden: false, overrideText: '' },
  ]
}

// ── Top-level fulfillment factory ────────────────────────────────────────────
export function makeDefaultFulfillment(order = {}) {
  const county = order.county || 'Greenville'
  const buyer  = 'the Proposed Insured'
  const seller = 'the Seller of record'
  return {
    meta: {
      address:     order.address || `Parcel in ${county} County, ${order.state || 'SC'}`,
      purpose:     'Purchase / New Loan',
      buyer, seller,
      parcelId:    '',
      underwriter: 'Old Republic National Title',
      county,
      state:       order.state || 'SC',
    },
    parcels: [{ id: uid(), value: '' }],
    searchEffectiveAt: '',
    deeds: [makeDeed()],
    titleVesting: { text: '', isAuto: true, autoText: '' },
    legalDescription: '',
    estateType: 'Fee Simple',
    titleSearchDoc: null,
    supplementaryDocs: [],
    requirements: defaultRequirements({ buyer, seller, county }),
    requirementsNone: false,
    exceptions: defaultExceptions(),
    exceptionsNone: false,
    invoice: {
      services: [{
        id: uid(),
        type: order.type ? `${order.type} Plus Update` : 'Title Search Plus Update',
        costPerUnit: 125, units: 1, locked: true,
      }],
      additionalCosts: [],
      chargeOnCancel: false,
    },
  }
}

// ── Completeness — 8 required sections (§2.3 "N of 8") ───────────────────────
export function completeness(f) {
  if (!f) return { items: [], done: 0, total: 8 }
  const vest = f.deeds?.[0] || {}
  const vestText = f.titleVesting?.isAuto ? titleVestingAuto(vest, f.meta?.county) : f.titleVesting?.text
  const items = [
    { key: 'parcels',     label: 'Parcel IDs',            done: (f.parcels || []).some(p => p.value.trim()) },
    { key: 'effective',   label: 'Search Effective Date', done: !!f.searchEffectiveAt },
    { key: 'deeds',       label: 'Deeds',                 done: !!(vest.grantor?.trim() && vest.grantee?.trim()) },
    { key: 'vesting',     label: 'Title Vesting',         done: !!(vestText && vestText.trim()) },
    { key: 'legal',       label: 'Legal Description',     done: !!f.legalDescription?.trim() },
    { key: 'estate',      label: 'Estate Type',           done: !!f.estateType?.trim() },
    { key: 'searchdoc',   label: 'Title Search Document', done: !!f.titleSearchDoc },
    { key: 'requirements',label: 'Commitment Requirements', done: f.requirementsNone || (f.requirements || []).length > 0 },
  ]
  return { items, done: items.filter(i => i.done).length, total: items.length }
}

// File validation shared by both upload sections (§2.6).
export const ACCEPTED_DOCS = '.pdf,.doc,.docx,application/pdf,application/msword,' +
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
export function validDocType(file) {
  const name = (file.name || '').toLowerCase()
  return /\.(pdf|doc|docx)$/.test(name)
}
export const fileKind = (name = '') =>
  /\.pdf$/i.test(name) ? 'pdf' : /\.docx?$/i.test(name) ? 'word' : 'other'
