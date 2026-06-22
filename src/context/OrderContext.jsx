import React, { createContext, useContext, useState } from 'react'
import { ORDERS, ACTIVITY } from '../data/mockData'

const OrderContext = createContext(null)

// Canonical pipeline. completeStep advances an order exactly one step along this.
//   received → screening → searching → examining → typing → delivered
// Roles drive the post-intake stages: screener → examiner → typer → delivery.
const PIPELINE = ['received', 'screening', 'searching', 'examining', 'typing', 'delivered']

// Human-readable stage name per role, used in the shared activity feed.
const STAGE_BY_ROLE = {
  screener: 'screening',
  examiner: 'examination',
  typer:    'typing',
  delivery: 'delivery',
}

const todayISO = () => new Date().toISOString().slice(0, 10)

export function OrderProvider({ children }) {
  const [orders, setOrders]           = useState(ORDERS)
  const [activityLog, setActivityLog] = useState(ACTIVITY)

  const log = (entry) => setActivityLog(a => [entry, ...a])

  // Admin assigns an order to a role queue, optionally pinning a specific person.
  // Queue keys ('screener' | 'examiner' | 'typer' | 'delivery') double as the
  // order's person-name field, so a pin writes straight to that field.
  const assignOrder = (orderId, { queue, personName } = {}) => {
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      const next = { ...o, assignedTo: queue }
      if (personName) next[queue] = personName
      if (o.status == null || o.status === 'received') next.status = 'received'
      return next
    }))
    log({
      id: Date.now(),
      action: `Admin assigned ${orderId} to ${queue}${personName ? ` · ${personName}` : ''}`,
      time: 'Just now',
      type: 'status',
    })
  }

  // A role reports completion back to Admin: advance one stage, drop out of the
  // queue (assignedTo → null), stamp the stage's completion date, and log it.
  const completeStep = (orderId, role, userName, notes) => {
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      const idx        = PIPELINE.indexOf(o.status)
      const nextStatus = idx >= 0 && idx < PIPELINE.length - 1 ? PIPELINE[idx + 1] : o.status
      const newIdx     = PIPELINE.indexOf(nextStatus)
      return {
        ...o,
        status:         nextStatus,
        assignedTo:     null,
        progress:       Math.round((newIdx / (PIPELINE.length - 1)) * 100),
        completed:      nextStatus === 'delivered' ? (o.completed || todayISO()) : o.completed,
        completedDates: { ...o.completedDates, [role]: todayISO() },
        completedBy:    { ...o.completedBy, [role]: userName },
      }
    }))
    log({
      id: Date.now(),
      action: `${userName} completed ${STAGE_BY_ROLE[role] || role} on ${orderId}${notes ? ` — ${notes}` : ''}`,
      time: 'Just now',
      type: 'progress',
    })
  }

  // Full edit save from the admin order detail modal.
  const updateOrder = (updated) =>
    setOrders(os => os.map(o => (o.id === updated.id ? updated : o)))

  // Role queues are driven by assignment, not status range.
  const getOrdersForRole = (role) => orders.filter(o => o.assignedTo === role)

  return (
    <OrderContext.Provider value={{
      orders, activityLog, assignOrder, completeStep, updateOrder, getOrdersForRole,
    }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => useContext(OrderContext)
