import React, { createContext, useContext, useState, useRef, useCallback } from 'react'
import { makeDefaultFulfillment } from '../data/fulfillment'
import { isSupabaseConfigured, fetchFulfillment, saveFulfillment } from '../lib/backend'

// Per-order Typer fulfillment state with a transient autosave indicator.
// Persists to Supabase (fulfillments.data JSONB) when configured; otherwise
// in-memory mock that survives navigation within the session.
const FulfillmentContext = createContext(null)

export function FulfillmentProvider({ children }) {
  const [byOrder, setByOrder] = useState({})       // { [orderId]: fulfillment }
  const [save, setSave]       = useState('idle')   // 'idle' | 'saving' | 'saved'
  const pulseTimer = useRef(null)
  const saveTimers = useRef({})                    // per-order debounce for backend writes
  const loaded     = useRef(new Set())             // orders already fetched/seeded

  const ensure = useCallback((order) => {
    if (loaded.current.has(order.id)) return
    loaded.current.add(order.id)
    if (isSupabaseConfigured) {
      fetchFulfillment(order.id).then(data => {
        if (data) { setByOrder(s => ({ ...s, [order.id]: data })) }
        else { const def = makeDefaultFulfillment(order); setByOrder(s => ({ ...s, [order.id]: def })); saveFulfillment(order.id, def) }
      })
    } else {
      setByOrder(s => (s[order.id] ? s : { ...s, [order.id]: makeDefaultFulfillment(order) }))
    }
  }, [])

  const pulse = useCallback(() => {
    setSave('saving')
    clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setSave('saved'), 550)
  }, [])

  const update = useCallback((orderId, recipe) => {
    setByOrder(s => {
      const next = recipe(s[orderId])
      if (isSupabaseConfigured) {
        clearTimeout(saveTimers.current[orderId])
        saveTimers.current[orderId] = setTimeout(() => saveFulfillment(orderId, next), 700)
      }
      return { ...s, [orderId]: next }
    })
    pulse()
  }, [pulse])

  return (
    <FulfillmentContext.Provider value={{ byOrder, ensure, update, save }}>
      {children}
    </FulfillmentContext.Provider>
  )
}

export const useFulfillmentStore = () => useContext(FulfillmentContext)
