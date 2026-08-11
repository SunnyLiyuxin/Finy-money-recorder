import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const show = useCallback(
    (msg, { type = 'default', duration = 2200, action } = {}) => {
      const id = ++idRef.current
      setToasts((t) => [...t, { id, msg, type, action }])
      if (duration > 0) {
        setTimeout(() => remove(id), duration)
      }
      return id
    },
    [remove]
  )

  return (
    <ToastCtx.Provider value={{ show, remove }}>
      {children}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 'calc(84px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (t.action) {
                  t.action.onClick()
                  remove(t.id)
                }
              }}
              style={{
                pointerEvents: t.action ? 'auto' : 'none',
                background: 'rgba(26,26,46,0.92)',
                color: '#fff',
                backdropFilter: 'blur(12px)',
                padding: '10px 16px',
                borderRadius: 14,
                fontSize: 14,
                maxWidth: '90vw',
                boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span>{t.msg}</span>
              {t.action && (
                <span style={{ color: '#4ECDC4', fontWeight: 600 }}>
                  {t.action.label}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
