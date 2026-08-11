import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

/** 卡片 */
export function Card({ children, className = '', style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: 'var(--card)',
        borderRadius: 20,
        padding: 16,
        boxShadow: 'var(--shadow)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** 分段控件 */
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 12,
        padding: 3,
        position: 'relative',
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: '7px 0',
              fontSize: 13,
              fontWeight: 600,
              color: active ? '#fff' : 'var(--text-secondary)',
              borderRadius: 9,
              position: 'relative',
              zIndex: 2,
              transition: 'color 0.2s',
            }}
          >
            {active && (
              <motion.div
                layoutId="seg-active"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--color-primary)',
                  borderRadius: 9,
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** 底部弹出 Sheet */
export function Sheet({ open, onClose, title, children, maxHeight = '80vh' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 1000,
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight,
              background: 'var(--card)',
              borderRadius: '24px 24px 0 0',
              zIndex: 1001,
              overflow: 'hidden',
              paddingBottom: 'env(safe-area-inset-bottom)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px 8px',
              }}
            >
              <div style={{ flex: 1 }} />
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: 'rgba(0,0,0,0.12)',
                  position: 'absolute',
                  left: '50%',
                  top: 10,
                  transform: 'translateX(-50%)',
                }}
              />
              <strong style={{ fontSize: 16, position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 12 }}>
                {title}
              </strong>
              <button
                onClick={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px 18px 18px' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** 空状态 */
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        color: 'var(--text-tertiary)',
      }}
    >
      {icon && (
        <div
          className="empty-icon-wrap"
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            background: 'rgba(78,205,196,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: 'var(--color-primary)',
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 13, marginTop: 6 }}>{subtitle}</div>
      )}
    </div>
  )
}

/** 进度条 */
export function ProgressBar({ percent, color = 'var(--color-primary)', trackColor = 'rgba(0,0,0,0.05)', height = 8 }) {
  const p = Math.max(0, Math.min(100, percent))
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: height / 2,
        background: trackColor,
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${p}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          height: '100%',
          borderRadius: height / 2,
          background: color,
        }}
      />
    </div>
  )
}
