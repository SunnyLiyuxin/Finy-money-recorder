import { CURRENCIES } from '../data/constants'
import { Check, ChevronRight } from 'lucide-react'

export default function CurrencyPicker({ value, onChange, title = '选择货币' }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CURRENCIES.map((c) => {
          const active = c.code === value
          return (
            <button
              key={c.code}
              onClick={() => onChange(c.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 14px',
                borderRadius: 14,
                background: active ? 'rgba(78,205,196,0.1)' : 'rgba(0,0,0,0.02)',
                border: active
                  ? '1px solid rgba(78,205,196,0.3)'
                  : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(78,205,196,0.12)',
                    color: 'var(--color-primary-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {c.code}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    符号 {c.symbol} · 参考汇率 {c.rate}
                  </div>
                </div>
              </div>
              {active && <Check size={18} color="var(--color-primary)" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
