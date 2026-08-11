import { motion } from 'framer-motion'
import { Delete } from 'lucide-react'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']

export default function NumberPad({ value, onChange, onConfirm, confirmLabel = '确认' }) {
  const press = (k) => {
    if (k === 'del') {
      onChange(value.slice(0, -1))
      return
    }
    if (k === '.') {
      if (value.includes('.')) return
      if (value === '') value = '0'
      onChange(value + '.')
      return
    }
    // 限制两位小数
    if (value.includes('.') && value.split('.')[1]?.length >= 2) return
    // 防止前导 0
    if (value === '0') onChange(k)
    else onChange(value + k)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
        padding: '6px 6px calc(env(safe-area-inset-bottom) + 6px)',
        background: 'var(--card)',
      }}
    >
      {KEYS.map((k) => {
        const isDel = k === 'del'
        return (
          <motion.button
            key={k}
            whileTap={{ scale: 0.94 }}
            onClick={() => press(k)}
            style={{
              height: 56,
              borderRadius: 16,
              fontSize: k === 'del' ? 18 : 22,
              fontWeight: 500,
              background: 'rgba(0,0,0,0.02)',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isDel ? <Delete size={22} /> : k}
          </motion.button>
        )
      })}
      {onConfirm && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onConfirm}
          style={{
            height: 56,
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            background:
              'linear-gradient(135deg, #7EDDD7 0%, #4ECDC4 100%)',
            boxShadow: '0 4px 14px rgba(78,205,196,0.4)',
            gridColumn: 'span 3',
          }}
        >
          {confirmLabel}
        </motion.button>
      )}
    </div>
  )
}
