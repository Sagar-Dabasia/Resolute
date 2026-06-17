import React, { createContext, useContext, useState } from 'react'
import { ORDERS, ACTIVITY } from '../data/mockData'

const OrderContext = createContext(null)

// Maps each role to the status their completion sets
const NEXT_STATUS = {
  screener: 'searching',
  delivery: 'examining',
  examiner: 'delivered',
}

export function OrderProvider({ children }) {
  const [orders, setOrders]        = useState(ORDERS)
  const [activityLog, setActivity] = useState(ACTIVITY)

  function assignOrder(orderId, { queue, personName }) {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o
      const update = { assignedTo: queue }
      update[queue] = personName || null
      return { ...o, ...update }
    }))
  }

  function completeStep(orderId, role, userName, notes) {
    const today = new Date().toISOString().split('T')[0]
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o
      return {
        ...o,
        status:         NEXT_STATUS[role] || o.status,
        assignedTo:     null,
        completedDates: { ...o.completedDates, [role]: today },
      }
    }))
    const stageName = { screener: 'Screening', delivery: 'Delivery', examiner: 'Examination' }[role] || role
    setActivity(prev => [
      {
        id:     orderId + '-' + role,
        action: `${userName} completed ${stageName} on ${orderId}${notes ? ' — ' + notes : ''}`,
        time:   'Just now',
        type:   'progress',
      },
      ...prev,
    ])
  }

  function getOrdersForRole(role) {
    return orders.filter(o => o.assignedTo === role)
  }

  return (
    <OrderContext.Provider value={{ orders, activityLog, assignOrder, completeStep, getOrdersForRole }}>
      {children}
    </OrderContext.Provider>
  )
}

export const useOrders = () => useContext(OrderContext)
