import React, { createContext, useContext, useState } from 'react'
import { ORDERS, ACTIVITY, nextRoleFor } from '../data/mockData'

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

  // A role reports completion: stamp the stage, then AUTO-ADVANCE the order into
  // the next role's queue so it shows up in that role's portal immediately. When
  // every role is done it's marked delivered. Admin can still reassign who works
  // the next stage via the Assign / detail modal.
  let advancedTo = null
  const completeStep = (orderId, role, userName, notes) => {
    advancedTo = null
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      const newDates = { ...o.completedDates, [role]: todayISO() }
      const nextRole = nextRoleFor({ completedDates: newDates })   // first role still to act
      advancedTo = nextRole
      const allDone = nextRole === null
      const idx        = PIPELINE.indexOf(o.status)
      const nextStatus = allDone ? 'delivered'
        : (idx >= 0 && idx < PIPELINE.length - 1 ? PIPELINE[idx + 1] : o.status)
      const newIdx     = PIPELINE.indexOf(nextStatus)
      return {
        ...o,
        status:         nextStatus,
        assignedTo:     nextRole,            // hand straight to the next role (null when finished)
        progress:       allDone ? 100 : Math.round((newIdx / (PIPELINE.length - 1)) * 100),
        completed:      allDone ? (o.completed || todayISO()) : o.completed,
        completedDates: newDates,
        completedBy:    { ...o.completedBy, [role]: userName },
      }
    }))
    log({
      id: Date.now(),
      action: `${userName} completed ${STAGE_BY_ROLE[role] || role} on ${orderId}`
        + (advancedTo ? ` → handed to ${advancedTo}` : ' → delivered')
        + (notes ? ` (${notes})` : ''),
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
