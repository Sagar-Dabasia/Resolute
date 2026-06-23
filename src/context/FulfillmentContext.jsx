import React, { createContext, useContext, useState, useRef, useCallback } from 'react'
import { makeDefaultFulfillment } from '../data/fulfillment'

// Per-order Typer fulfillment state with a transient autosave indicator.
// In-memory mock persistence — survives navigation within the session.
const FulfillmentContext = createContext(null)

export function FulfillmentProvider({ children }) {
  const [byOrder, setByOrder] = useState({})       // { [orderId]: fulfillment }
  const [save, setSave]       = useState('idle')   // 'idle' | 'saving' | 'saved'
  const timer = useRef(null)

  // Lazily seed an order's fulfillment from its order record.
  const ensure = useCallback((order) => {
    setByOrder(s => (s[order.id] ? s : { ...s, [order.id]: makeDefaultFulfillment(order) }))
  }, [])

  const pulse = useCallback(() => {
    setSave('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSave('saved'), 550)
  }, [])

  // update(orderId, recipe) — recipe is (draft) => newFulfillment (immutable update).
  const update = useCallback((orderId, recipe) => {
    setByOrder(s => ({ ...s, [orderId]: recipe(s[orderId]) }))
    pulse()
  }, [pulse])

  return (
    <FulfillmentContext.Provider value={{ byOrder, ensure, update, save }}>
      {children}
    </FulfillmentContext.Provider>
  )
}

export const useFulfillmentStore = () => useContext(FulfillmentContext)
