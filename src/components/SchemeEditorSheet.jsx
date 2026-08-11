import { useState, useMemo, useEffect } from 'react'
import { Sheet } from './ui'
import { useStore } from '../store/useStore'
import { useToast } from './Toast'
import { CURRENCIES, DEFAULT_SCHEME } from '../data/constants'

/**
 * 新建汇率方案
 *
 * 规则：
 * - 每种货币都可独立设置汇率（相对 CNY）。
 * - 用户未修改的币种，沿用默认方案的汇率。
 * - 保存后成为新方案，并自动设为当前激活方案（所有换算立刻按新方案计算）。
 */
export default function SchemeEditorSheet({ open, onClose }) {
  const store = useStore()
  const toast = useToast()

  // 名称 + 每个币种的输入值（字符串，便于输入控制）
  const [name, setName] = useState('')
  const [rates, setRates] = useState({}) // { USD: '7.2', ... } 只存被编辑过的

  // 打开时重置
  useEffect(() => {
    if (open) {
      setName('')
      setRates({})
    }
  }, [open])

  const handleRateChange = (code, value) => {
    setRates((r) => ({ ...r, [code]: value }))
  }

  // 合并：用户编辑值优先，未编辑用默认
  const mergedRates = useMemo(() => {
    const out = {}
    CURRENCIES.forEach((c) => {
      const edited = rates[c.code]
      if (edited !== undefined && edited !== '') {
        const num = parseFloat(edited)
        out[c.code] = isNaN(num) ? DEFAULT_SCHEME.rates[c.code] : num
      } else {
        out[c.code] = DEFAULT_SCHEME.rates[c.code]
      }
    })
    return out
  }, [rates])

  const editedCount = Object.values(rates).filter(
    (v) => v !== undefined && v !== ''
  ).length

  const handleSave = () => {
    const finalName = name.trim() || `自定义方案 ${store.schemes.length}`
    const id = store.addScheme({ name: finalName, rates: mergedRates })
    // 立即设为当前激活方案：所有换算按新方案计算
    store.setActiveScheme(id)
    toast.show(`已创建并应用方案「${finalName}」`)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="新建汇率方案" maxHeight="86vh">
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, lineHeight: 1.5 }}>
        设置每种货币相对人民币（CNY）的汇率。未修改的币种将沿用默认方案的汇率。保存后该方案立即生效，所有换算按此计算。
      </div>

      {/* 方案名称 */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
        方案名称
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`自定义方案 ${store.schemes.length}`}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.02)',
          fontSize: 15,
          marginBottom: 16,
        }}
      />

      {/* 各币种汇率 */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>货币汇率（1 该币 = ? CNY）</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
          已修改 {editedCount} 项
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CURRENCIES.map((c) => {
          const isEdited = rates[c.code] !== undefined && rates[c.code] !== ''
          const display = isEdited ? rates[c.code] : ''
          const effective = isEdited
            ? parseFloat(rates[c.code]) || DEFAULT_SCHEME.rates[c.code]
            : DEFAULT_SCHEME.rates[c.code]
          return (
            <div
              key={c.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: isEdited ? 'rgba(78,205,196,0.06)' : 'rgba(0,0,0,0.02)',
                border: isEdited ? '1px solid rgba(78,205,196,0.25)' : '1px solid transparent',
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(78,205,196,0.1)',
                  color: 'var(--color-primary-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {c.code}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  默认 {DEFAULT_SCHEME.rates[c.code]}
                  {isEdited && ` · 生效 ${effective}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  value={display}
                  onChange={(e) => handleRateChange(c.code, e.target.value)}
                  placeholder={String(DEFAULT_SCHEME.rates[c.code])}
                  type="number"
                  inputMode="decimal"
                  style={{
                    width: 80,
                    padding: '8px 10px',
                    borderRadius: 9,
                    background: '#fff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 保存 */}
      <button
        onClick={handleSave}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 14,
          background: 'linear-gradient(135deg,#7EDDD7,#4ECDC4)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          marginTop: 16,
          boxShadow: '0 6px 18px rgba(78,205,196,0.35)',
        }}
      >
        创建并应用方案
      </button>
    </Sheet>
  )
}
