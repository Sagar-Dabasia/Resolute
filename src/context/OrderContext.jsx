import React, { createContext, useContext, useState, useEffect } from 'react'
import { ORDERS, ACTIVITY, nextRoleFor } from '../data/mockData'
import { isSupabaseConfigured, fetchOrders, saveOrder, subscribeOrders } from '../lib/backend'

const OrderContext = createContext(null)

// received → screening → searching → examining → typing → delivered
const PIPELINE = ['received', 'screening', 'searching', 'examining', 'typing', 'delivered']
const STAGE_BY_ROLE = { screener: 'screening', examiner: 'examination', typer: 'typing', delivery: 'delivery' }
const todayISO = () => new Date().toISOString().slice(0, 10)

export function OrderProvider({ children }) {
  const [orders, setOrders]           = useState(ORDERS)
  const [activityLog, setActivityLog] = useState(ACTIVITY)

  // Hydrate from Supabase + live updates when configured; otherwise keep mock.
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let unsub = () => {}
    const load = () => fetchOrders().then(rows => { if (rows) setOrders(rows) })
    load()
    unsub = subscribeOrders(load)
    return () => unsub()
  }, [])

  const log = (entry) => setActivityLog(a => [entry, ...a])
  const persist = (order) => { if (isSupabaseConfigured) saveOrder(order) }

  const assignOrder = (orderId, { queue, personName } = {}) => {
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      const next = { ...o, assignedTo: queue }
      if (personName) next[queue] = personName
      if (o.status == null || o.status === 'received') next.status = 'received'
      persist(next)
      return next
    }))
    log({ id: Date.now(), action: `Admin assigned ${orderId} to ${queue}${personName ? ` · ${personName}` : ''}`, time: 'Just now', type: 'status' })
  }

  let advancedTo = null
  const completeStep = (orderId, role, userName, notes) => {
    advancedTo = null
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      const newDates = { ...o.completedDates, [role]: todayISO() }
      const nextRole = nextRoleFor({ completedDates: newDates })
      advancedTo = nextRole
      const allDone = nextRole === null
      const idx = PIPELINE.indexOf(o.status)
      const nextStatus = allDone ? 'delivered' : (idx >= 0 && idx < PIPELINE.length - 1 ? PIPELINE[idx + 1] : o.status)
      const newIdx = PIPELINE.indexOf(nextStatus)
      const next = {
        ...o, status: nextStatus, assignedTo: nextRole,
        progress: allDone ? 100 : Math.round((newIdx / (PIPELINE.length - 1)) * 100),
        completed: allDone ? (o.completed || todayISO()) : o.completed,
        completedDates: newDates, completedBy: { ...o.completedBy, [role]: userName },
      }
      persist(next)
      return next
    }))
    log({
      id: Date.now(),
      action: `${userName} completed ${STAGE_BY_ROLE[role] || role} on ${orderId}`
        + (advancedTo ? ` → handed to ${advancedTo}` : ' → delivered') + (notes ? ` (${notes})` : ''),
      time: 'Just now', type: 'progress',
    })
  }

  // A role finishes its stage and hands the order BACK to Admin to assign the
  // next stage (screener → admin, examiner → admin). Stamps completion + saves
  // any workflow data (assignment choice, uploaded doc), advances status, and
  // parks the order in the Admin queue (assignedTo = 'admin').
  const returnToAdmin = (orderId, role, userName, notes, extra = {}) => {
    setOrders(os => os.map(o => {
      if (o.id !== orderId) return o
      const idx = PIPELINE.indexOf(o.status)
      const nextStatus = idx >= 0 && idx < PIPELINE.length - 1 ? PIPELINE[idx + 1] : o.status
      const newIdx = PIPELINE.indexOf(nextStatus)
      const next = {
        ...o,
        status: nextStatus,
        assignedTo: 'admin',
        progress: Math.round((newIdx / (PIPELINE.length - 1)) * 100),
        completedDates: { ...o.completedDates, [role]: todayISO() },
        completedBy: { ...o.completedBy, [role]: userName },
        workflow: { ...o.workflow, ...extra },
      }
      persist(next)
      return next
    }))
    log({ id: Date.now(), action: `${userName} completed ${STAGE_BY_ROLE[role] || role} on ${orderId} → returned to Admin for assignment` + (notes ? ` (${notes})` : ''), time: 'Just now', type: 'status' })
  }

  const updateOrder = (updated) => {
    setOrders(os => os.map(o => (o.id === updated.id ? updated : o)))
    persist(updated)
  }

  const getOrdersForRole = (role) => orders.filter(o => o.assignedTo === role)

  return (
    <OrderContext.Provider value={{ orders, activityLog, assignOrder, completeStep, returnToAdmin, updateOrder, getOrdersForRole }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => useContext(OrderContext)
