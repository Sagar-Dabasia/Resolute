import React, { useState } from 'react'
import ClauseList from './ClauseList'
import MortgageLienDrawer from './MortgageLienDrawer'
import { requirementText, emptyLien, uid } from '../../../data/fulfillment'

export default function RequirementsSection({ requirements, noneFlag, county, hasPayoff, onChange, onToggleNone }) {
  const [openId, setOpenId] = useState(null)
  const openItem = requirements.find(r => r.id === openId)

  const addOptions = [
    { label: 'Text requirement', hint: 'Free-form editable text', make: () => ({ id: uid(), kind: 'text', text: '' }) },
    { label: 'Mortgage payoff', hint: 'Opens the Mortgage Lien drawer', drawer: true,
      make: () => ({ id: uid(), kind: 'mortgage', lien: emptyLien(county), overridden: false, overrideText: '' }) },
  ]

  return (
    <>
      <ClauseList
        items={requirements} onChange={onChange} resolveText={requirementText}
        noneFlag={noneFlag} onToggleNone={onToggleNone} noneLabel="No requirements"
        addOptions={addOptions} addLabel="Add Requirement"
        onOpenDrawer={item => setOpenId(item.id)} />
      <MortgageLienDrawer
        open={!!openItem} onClose={() => setOpenId(null)}
        lien={openItem?.lien} hasPayoff={hasPayoff}
        onSave={lien => onChange(requirements.map(r => r.id === openId ? { ...r, lien, overridden: false } : r))} />
    </>
  )
}
