import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, UserCheck, Calendar } from 'lucide-react'
import { useOrders } from '../context/OrderContext'
import { USERS } from '../data/mockData'

const ROLE_COLOR = '#3d7020'
const Q = {
  bg: '#f0f2f4', card: '#ffffff', border: '#e2e8f0',
  text: '#1e293b', muted: '#64748b', faint: '#94a3b8',
  shadow: '0 4px 24px rgba(0,0,0,0.12)',
}

const DEFAULT_QUEUE = {
  received:  'screener',
  screening: 'screener',
  searching: 'delivery',
  examining: 'examiner',
}

const STAGE_LABELS = {
  screener: 'Screener',
  delivery: 'Delivery',
  examiner: 'Examiner',
}

export default function AssignModal({ order, onClose }) {
  const { assignOrder } = useOrders()
  const [queue, setQueue]           = useState(DEFAULT_QUEUE[order.status] || 'screener')
  const [personName, setPersonName] = useState('')

  const usersForQueue = USERS.filter(u => u.role === queue && u.status === 'active')

  function handleConfirm() {
    assignOrder(order.id, { queue, personName: personName || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: Q.card, borderRadius: 14, boxShadow: Q.shadow, width: '100%', maxWidth: 460, padding: 28 }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: ROLE_COLOR, marginBottom: 4 }}>Assign Order</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: Q.text }}>{order.id}</div>
            <div style={{ fontSize: 13, color: Q.muted, marginTop: 2 }}>{order.client} · {order.type}</div>
          </div>
          <button onClick={onClose} style={{ padding: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', color: Q.faint, borderRadius: 6 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* completedDates summary */}
        <div style={{ background: Q.bg, border: `1px solid ${Q.border}`, borderRadius: 10,
          padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: Q.faint, marginBottom: 10, display: 'flex',
            alignItems: 'center', gap: 6 }}>
            <Calendar style={{ width: 12, height: 12 }} /> Stage Completion Dates
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {['screener', 'delivery', 'examiner'].map(role => (
              <div key={role} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: Q.faint, textTransform: 'capitalize',
                  marginBottom: 2 }}>{STAGE_LABELS[role]}</div>
                <div style={{ fontSize: 12, fontWeight: 600,
                  color: order.completedDates?.[role] ? '#16a34a' : Q.faint }}>
                  {order.completedDates?.[role] || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage radio */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: Q.faint, marginBottom: 10 }}>
            Assign to Stage
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['screener', 'delivery', 'examiner'].map(role => (
              <button key={role} onClick={() => { setQueue(role); setPersonName('') }}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: queue === role ? `2px solid ${ROLE_COLOR}` : `2px solid ${Q.border}`,
                  background: queue === role ? `${ROLE_COLOR}0f` : Q.bg,
                  color: queue === role ? ROLE_COLOR : Q.muted,
                }}>
                {STAGE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {/* Person dropdown */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: Q.faint, marginBottom: 8 }}>
            Assign To (optional)
          </label>
          <select value={personName} onChange={e => setPersonName(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', border: `1px solid ${Q.border}`,
              borderRadius: 8, fontSize: 13, color: Q.text, background: Q.bg,
              outline: 'none', cursor: 'pointer',
            }}
            onFocus={e => e.target.style.borderColor = ROLE_COLOR}
            onBlur={e => e.target.style.borderColor = Q.border}>
            <option value="">Any available</option>
            {usersForQueue.map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleConfirm}
            style={{
              flex: 1, padding: '10px 16px', background: ROLE_COLOR, border: 'none',
              borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseOver={e => e.currentTarget.style.background = '#4d8c2a'}
            onMouseOut={e => e.currentTarget.style.background = ROLE_COLOR}>
            <UserCheck style={{ width: 15, height: 15 }} /> Confirm Assignment
          </button>
          <button onClick={onClose}
            style={{
              padding: '10px 16px', border: `1px solid ${Q.border}`, borderRadius: 8,
              background: 'transparent', color: Q.muted, fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}>
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  )
}
