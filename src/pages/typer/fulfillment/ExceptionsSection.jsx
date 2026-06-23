import React, { useState } from 'react'
import ClauseList from './ClauseList'
import ExceptionDrawer from './ExceptionDrawer'
import { exceptionText, uid } from '../../../data/fulfillment'

export default function ExceptionsSection({ exceptions, noneFlag, onChange, onToggleNone }) {
  const [openId, setOpenId] = useState(null)
  const openItem = exceptions.find(e => e.id === openId)

  const addOptions = [
    { label: 'Custom exception', hint: 'Free-form editable text', make: () => ({ id: uid(), kind: 'text', text: '' }) },
    { label: 'Survey / Encroachment', hint: 'Structured drawer', drawer: true,
      make: () => ({ id: uid(), kind: 'survey', surveyDate: '', surveyor: '', encroachmentDescription: '', overridden: false, overrideText: '' }) },
    { label: 'Plat Map', hint: 'Structured drawer', drawer: true,
      make: () => ({ id: uid(), kind: 'platmaps', maps: [], overridden: false, overrideText: '' }) },
    { label: 'Easement', hint: 'Structured drawer', drawer: true,
      make: () => ({ id: uid(), kind: 'easement', recordedDate: '', book: '', page: '', overridden: false, overrideText: '' }) },
  ]

  return (
    <>
      <ClauseList
        items={exceptions} onChange={onChange} resolveText={exceptionText}
        noneFlag={noneFlag} onToggleNone={onToggleNone} noneLabel="No exceptions"
        addOptions={addOptions} addLabel="Add Exception"
        onOpenDrawer={item => setOpenId(item.id)} />
      <ExceptionDrawer
        open={!!openItem} onClose={() => setOpenId(null)}
        exception={openItem}
        onSave={updated => onChange(exceptions.map(e => e.id === openId ? { ...updated, overridden: false } : e))} />
    </>
  )
}
