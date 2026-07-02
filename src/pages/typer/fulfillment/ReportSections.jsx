import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Label, TextInput, TextArea, DateInput, MoneyInput, GhostButton, RoundBtn, T } from './ui'
import { makeJudgment, uid } from '../../../data/fulfillment'

const Minus = () => <span className="text-[15px] leading-none">−</span>
const Pair = ({ children }) => <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>

// ── Search Information ───────────────────────────────────────────────────────
export function SearchInformation({ meta, onChange }) {
  const f = (k) => (v) => onChange({ [k]: v })
  return (
    <div className="space-y-3">
      <Pair>
        <div><Label>Client Order Number</Label><TextInput value={meta.clientOrderNo} onChange={f('clientOrderNo')} numeric /></div>
        <div><Label>Product Type</Label><TextInput value={meta.productType} onChange={f('productType')} /></div>
      </Pair>
      <div><Label>Property Address</Label><TextInput value={meta.address} onChange={f('address')} /></div>
      <Pair>
        <div><Label>State &amp; County</Label><TextInput value={`${meta.county}, ${meta.state}`} onChange={() => {}} disabled className="opacity-70" /></div>
        <div><Label>Search Date</Label><DateInput value={meta.searchDate} onChange={f('searchDate')} /></div>
      </Pair>
      <div><Label hint="Effective Date is captured in its own section below">Record Owner</Label><TextInput value={meta.recordOwner} onChange={f('recordOwner')} placeholder="Current record owner" /></div>
    </div>
  )
}

// ── Assessment & Tax Information ──────────────────────────────────────────────
export function AssessmentTax({ tax, onChange }) {
  const f = (k) => (v) => onChange({ [k]: v })
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><Label>Assessed Land</Label><MoneyInput value={tax.assessedLand} onChange={f('assessedLand')} /></div>
        <div><Label>Assessed Building</Label><MoneyInput value={tax.assessedBuilding} onChange={f('assessedBuilding')} /></div>
        <div><Label>Total Assessed</Label><MoneyInput value={tax.totalAssessed} onChange={f('totalAssessed')} /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div><Label>Parcel No.</Label><TextInput value={tax.parcelNo} onChange={f('parcelNo')} numeric /></div>
        <div><Label>Tax Year</Label><TextInput value={tax.taxYear} onChange={f('taxYear')} numeric /></div>
        <div><Label>Status</Label><TextInput value={tax.status} onChange={f('status')} placeholder="Paid / Due" /></div>
      </div>
      <Pair>
        <div><Label>1st Half Amount</Label><MoneyInput value={tax.firstHalfAmount} onChange={f('firstHalfAmount')} /></div>
        <div><Label>1st Half Paid Date</Label><DateInput value={tax.firstHalfPaidDate} onChange={f('firstHalfPaidDate')} /></div>
      </Pair>
      <Pair>
        <div><Label>2nd Half Amount</Label><MoneyInput value={tax.secondHalfAmount} onChange={f('secondHalfAmount')} /></div>
        <div><Label>2nd Half Paid Date</Label><DateInput value={tax.secondHalfPaidDate} onChange={f('secondHalfPaidDate')} /></div>
      </Pair>
      <div><Label>Comments</Label><TextArea value={tax.comments} onChange={f('comments')} rows={2} placeholder="Tax comments…" /></div>
    </div>
  )
}

// ── Judgments / Liens (repeatable) ───────────────────────────────────────────
export function JudgmentsLiens({ items, onChange }) {
  const add = () => onChange([...items, makeJudgment()])
  const set = (id, patch) => onChange(items.map(j => j.id === id ? { ...j, ...patch } : j))
  const rm  = (id) => onChange(items.filter(j => j.id !== id))
  return (
    <div className="space-y-2.5">
      {items.length === 0 && <div className="text-[12.5px] italic" style={{ color: T.dim }}>No judgments or liens recorded.</div>}
      {items.map((j, i) => (
        <motion.div key={j.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-semibold" style={{ color: T.accentBright }}>LIEN {i + 1}</span>
            <RoundBtn icon={Minus} danger title="Remove" onClick={() => rm(j.id)} />
          </div>
          <div className="space-y-2.5">
            <Pair>
              <div><Label>Instrument Name</Label><TextInput value={j.instrumentName} onChange={v => set(j.id, { instrumentName: v })} /></div>
              <div><Label>Case No.</Label><TextInput value={j.caseNo} onChange={v => set(j.id, { caseNo: v })} numeric /></div>
            </Pair>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><Label>Filed On</Label><DateInput value={j.filedOn} onChange={v => set(j.id, { filedOn: v })} /></div>
              <div><Label>Rec Date</Label><DateInput value={j.recDate} onChange={v => set(j.id, { recDate: v })} /></div>
              <div><Label>Amount</Label><MoneyInput value={j.amount} onChange={v => set(j.id, { amount: v })} /></div>
            </div>
            <Pair>
              <div><Label>Book</Label><TextInput value={j.book} onChange={v => set(j.id, { book: v })} numeric /></div>
              <div><Label>Page</Label><TextInput value={j.page} onChange={v => set(j.id, { page: v })} numeric /></div>
            </Pair>
            <div><Label>Comments</Label><TextArea value={j.comments} onChange={v => set(j.id, { comments: v })} rows={2} /></div>
          </div>
        </motion.div>
      ))}
      <GhostButton icon={Plus} onClick={add}>Add Judgment / Lien</GhostButton>
    </div>
  )
}

// ── Generic free-text line list (Names Searched, Additional Information) ──────
export function TextLineList({ items, onChange, placeholder, addLabel = 'Add Line' }) {
  const add = () => onChange([...items, { id: uid(), value: '' }])
  const set = (id, value) => onChange(items.map(i => i.id === id ? { ...i, value } : i))
  const rm  = (id) => onChange(items.length > 1 ? items.filter(i => i.id !== id) : items.map(i => i.id === id ? { ...i, value: '' } : i))
  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.id} className="flex items-center gap-2">
          <TextInput value={it.value} onChange={v => set(it.id, v)} placeholder={placeholder} />
          <RoundBtn icon={Minus} danger title="Remove" onClick={() => rm(it.id)} />
        </div>
      ))}
      <GhostButton icon={Plus} onClick={add}>{addLabel}</GhostButton>
    </div>
  )
}

// ── Disclaimer (fixed boilerplate, editable as escape hatch) ─────────────────
export function DisclaimerBlock({ value, onChange }) {
  return (
    <div>
      <div className="text-[11px] mb-2" style={{ color: T.dim }}>Fixed report boilerplate — editable only if a specific file requires it.</div>
      <TextArea value={value} onChange={onChange} rows={7} />
    </div>
  )
}
