import React, { useState, useEffect } from 'react'
import { DownloadCloud, Link2, Plus } from 'lucide-react'
import { Drawer, Label, TextInput, DateInput, MoneyInput, GhostButton, AccentButton, RoundBtn, ClausePreview, T } from './ui'
import { mortgageClause, emptyLien, uid } from '../../../data/fulfillment'

// Two-up field grid helper.
const Pair = ({ children }) => <div className="grid grid-cols-2 gap-3">{children}</div>

function ListField({ title, items, onChange, placeholder, emptyText }) {
  const add = () => onChange([...items, { id: uid(), text: '' }])
  const set = (id, text) => onChange(items.map(i => i.id === id ? { ...i, text } : i))
  const rm  = (id) => onChange(items.filter(i => i.id !== id))
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: T.faint }}>{title}</span>
        <RoundBtn icon={Plus} title={`Add ${title.toLowerCase()}`} onClick={add} />
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] italic px-2.5 py-2 rounded-md" style={{ color: T.dim, background: 'rgba(245,240,224,0.025)' }}>{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="flex items-center gap-2">
              <TextInput value={it.text} onChange={t => set(it.id, t)} placeholder={placeholder} />
              <RoundBtn icon={() => <span className="text-[15px] leading-none">−</span>} danger title="Remove" onClick={() => rm(it.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Mortgage Lien drawer (§2.5). Edits a lien object; Save writes it back to the
// requirement row. Live clause preview renders the fixed-language §2.9 template.
export default function MortgageLienDrawer({ open, onClose, lien, onSave, hasPayoff }) {
  const [draft, setDraft] = useState(lien || emptyLien())
  useEffect(() => { if (open) setDraft(lien || emptyLien()) }, [open, lien])

  const set = (k, val) => setDraft(d => ({ ...d, [k]: val }))
  const save = () => { onSave(draft); onClose() }

  return (
    <Drawer open={open} onClose={onClose} title="Mortgage Lien" subtitle="MTGX01 — Mortgage Payoff"
      footer={
        <div className="flex items-center justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <AccentButton onClick={save}>Save to Requirement</AccentButton>
        </div>
      }>
      <div className="space-y-4">
        <GhostButton icon={DownloadCloud} disabled={!hasPayoff}
          className={!hasPayoff ? 'opacity-40 cursor-not-allowed' : ''}
          title={hasPayoff ? 'Import values from payoff statement' : 'No payoff on file'}>
          Import From Payoff
        </GhostButton>

        <Pair>
          <div><Label>Lender</Label><TextInput value={draft.lender} onChange={v => set('lender', v)} placeholder="Lender name" /></div>
          <div><Label>Mortgagor</Label><TextInput value={draft.mortgagor} onChange={v => set('mortgagor', v)} placeholder="Borrower name" /></div>
        </Pair>
        <Pair>
          <div><Label>Date of Mortgage</Label><DateInput value={draft.dateOfMortgage} onChange={v => set('dateOfMortgage', v)} /></div>
          <div><Label>Date Recorded</Label><DateInput value={draft.dateRecorded} onChange={v => set('dateRecorded', v)} /></div>
        </Pair>
        <Pair>
          <div><Label>Amount</Label><MoneyInput value={draft.amount} onChange={v => set('amount', v)} /></div>
          <div><Label>Instrument #</Label><TextInput value={draft.instrument} onChange={v => set('instrument', v)} numeric /></div>
        </Pair>
        <Pair>
          <div><Label>Book</Label><TextInput value={draft.book} onChange={v => set('book', v)} numeric /></div>
          <div><Label>Page</Label><TextInput value={draft.page} onChange={v => set('page', v)} numeric /></div>
        </Pair>
        <Pair>
          <div><Label>Cert. of Title #</Label><TextInput value={draft.certOfTitle} onChange={v => set('certOfTitle', v)} numeric /></div>
          <div><Label>Doc #</Label><TextInput value={draft.docNo} onChange={v => set('docNo', v)} numeric /></div>
        </Pair>
        <div>
          <Label hint="URL to recorded document">Hyperlink</Label>
          <div className="relative">
            <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: T.faint }} />
            <TextInput value={draft.hyperlink} onChange={v => set('hyperlink', v)} placeholder="https://…" className="!pl-7" />
          </div>
        </div>

        <div className="h-px" style={{ background: T.borderSoft }} />
        <ListField title="Assignments" items={draft.assignments || []} onChange={v => set('assignments', v)}
          placeholder="Assigned to … recorded in Book/Page …" emptyText="No assignments added." />
        <ListField title="Subordinations" items={draft.subordinations || []} onChange={v => set('subordinations', v)}
          placeholder="Subordinated to … recorded in Book/Page …" emptyText="No subordinations added." />

        <div className="h-px" style={{ background: T.borderSoft }} />
        <ClausePreview text={mortgageClause(draft)} label="Generated requirement" />
      </div>
    </Drawer>
  )
}
