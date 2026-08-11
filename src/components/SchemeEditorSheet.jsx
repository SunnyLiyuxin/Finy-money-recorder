import { useState, useMemo, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff, Check } from 'lucide-react'
import { Sheet } from './ui'
import { useStore } from '../store/useStore'
import { useToast } from './Toast'
import { CURRENCIES, DEFAULT_SCHEME } from '../data/constants'
import { formatUpdateTime } from '../services/exchangeRate'

/**
 * 新建汇率方案（实时版）
 *
 * 原理与手动输入版完全一致：
 *   - 仍是创建一个汇率方案，rates 写入后所有换算立即按新值计算。
 *   - 区别：rates 不再手敲，而是从国际实时汇率 API 自动拉取。
 *
 * 用户仍可逐币种微调（覆盖实时值），未修改的沿用实时汇率。
 */
export default function SchemeEditorSheet({ open, onClose }) {
  const store = useStore()
  const toast = useToast()

  const [name, setName] = useState('')
  // 实时拉取的汇率基准（用户在此基础上可微调）
  const [baseRates, setBaseRates] = useState({}) // 来自 API 的实时值
  const [overrides, setOverrides] = useState({}) // 用户手动覆盖的值
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState('')

  // 打开时自动拉取实时汇率
  useEffect(() => {
    if (!open) return
    setName('')
    setOverrides({})
    setBaseRates({})
    setError(null)
    loadLiveRates(true)
  }, [open])

  const loadLiveRates = async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const result = await store.fetchLiveRates(force)
      setBaseRates(result.rates)
      setUpdatedAt(result.updatedAt)
    } catch (e) {
      setError(e.message || '获取实时汇率失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOverride = (code, value) => {
    setOverrides((r) => ({ ...r, [code]: value }))
  }

  // 合并：用户覆盖值优先，否则用实时汇率，再否则用默认
  const mergedRates = useMemo(() => {
    const out = {}
    CURRENCIES.forEach((c) => {
      const ov = overrides[c.code]
      if (ov !== undefined && ov !== '') {
        const num = parseFloat(ov)
        out[c.code] = isNaN(num) ? (baseRates[c.code] ?? DEFAULT_SCHEME.rates[c.code]) : num
      } else if (baseRates[c.code] !== undefined) {
        out[c.code] = baseRates[c.code]
      } else {
        out[c.code] = DEFAULT_SCHEME.rates[c.code]
      }
    })
    return out
  }, [overrides, baseRates])

  const editedCount = Object.values(overrides).filter(
    (v) => v !== undefined && v !== ''
  ).length

  const handleSave = () => {
    const finalName = name.trim() || `实时汇率 ${new Date().toLocaleDateString('zh-CN')}`
    const id = store.addScheme({
      name: finalName,
      rates: mergedRates,
      liveUpdatedAt: new Date().toISOString(),
    })
    store.setActiveScheme(id)
    toast.show(`已创建并应用方案「${finalName}」`)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="新建汇率方案" maxHeight="88vh">
      {/* 说明 + 实时状态 */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-tertiary)',
          marginBottom: 12,
          lineHeight: 1.5,
        }}
      >
        汇率自动从国际实时数据源拉取（每日更新）。保存后该方案立即生效，所有换算按此计算。仍可逐币种微调覆盖实时值。
      </div>

      {/* 实时状态条 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: 12,
          marginBottom: 14,
          background: loading
            ? 'rgba(78,205,196,0.08)'
            : error
            ? 'rgba(255,107,107,0.08)'
            : 'rgba(78,205,196,0.10)',
          border: `1px solid ${
            loading
              ? 'rgba(78,205,196,0.2)'
              : error
              ? 'rgba(255,107,107,0.25)'
              : 'rgba(78,205,196,0.28)'
          }`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {loading ? (
            <RefreshCw size={14} color="var(--color-primary)" className="spin" />
          ) : error ? (
            <WifiOff size={14} color="var(--color-expense)" />
          ) : (
            <Wifi size={14} color="var(--color-primary-dark)" />
          )}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: error ? 'var(--color-expense)' : 'var(--color-primary-dark)',
            }}
          >
            {loading
              ? '正在获取实时汇率…'
              : error
              ? '获取失败'
              : updatedAt
              ? `实时汇率 · 更新于 ${formatUpdateTime(updatedAt)}`
              : '实时汇率已就绪'}
          </span>
        </div>
        <button
          onClick={() => loadLiveRates(true)}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 8,
            background: 'rgba(78,205,196,0.15)',
            color: 'var(--color-primary-dark)',
            fontSize: 11,
            fontWeight: 700,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          刷新
        </button>
      </div>

      {error && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--color-expense)',
            marginBottom: 12,
            padding: '8px 10px',
            background: 'rgba(255,107,107,0.06)',
            borderRadius: 8,
          }}
        >
          {error} · 将沿用默认汇率，可点击「刷新」重试
        </div>
      )}

      {/* 方案名称 */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        方案名称
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`实时汇率 ${new Date().toLocaleDateString('zh-CN')}`}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(0,0,0,0.02)',
          fontSize: 15,
          marginBottom: 16,
          border: '1px solid transparent',
        }}
      />

      {/* 各币种汇率 */}
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 600,
          marginBottom: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>货币汇率（1 该币 = ? CNY）</span>
        <span
          style={{
            fontSize: 11,
            color: editedCount > 0 ? 'var(--color-primary-dark)' : 'var(--text-tertiary)',
            fontWeight: 500,
          }}
        >
          {editedCount > 0 ? `已微调 ${editedCount} 项` : '全部沿用实时值'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CURRENCIES.map((c) => {
          const liveVal = baseRates[c.code]
          const isOverridden = overrides[c.code] !== undefined && overrides[c.code] !== ''
          const display = isOverridden ? overrides[c.code] : liveVal !== undefined ? String(liveVal) : ''
          const effective = isOverridden
            ? parseFloat(overrides[c.code]) || liveVal || DEFAULT_SCHEME.rates[c.code]
            : liveVal ?? DEFAULT_SCHEME.rates[c.code]
          const isLive = liveVal !== undefined && !isOverridden
          return (
            <div
              key={c.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 12,
                background: isOverridden
                  ? 'rgba(78,205,196,0.06)'
                  : isLive
                  ? 'rgba(78,205,196,0.04)'
                  : 'rgba(0,0,0,0.02)',
                border: isOverridden
                  ? '1px solid rgba(78,205,196,0.25)'
                  : isLive
                  ? '1px solid rgba(78,205,196,0.12)'
                  : '1px solid transparent',
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
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {isLive && <Check size={10} color="var(--color-primary)" />}
                  {isOverridden ? `微调 · 生效 ${effective}` : isLive ? `实时 ${effective}` : `默认 ${DEFAULT_SCHEME.rates[c.code]}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  value={display}
                  onChange={(e) => handleOverride(c.code, e.target.value)}
                  placeholder={liveVal !== undefined ? String(liveVal) : String(DEFAULT_SCHEME.rates[c.code])}
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
        disabled={loading && !baseRates}
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
          border: 'none',
          opacity: loading && !baseRates ? 0.6 : 1,
        }}
      >
        创建并应用方案
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Sheet>
  )
}
