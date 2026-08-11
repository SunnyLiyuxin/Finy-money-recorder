import { useState, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff, TrendingUp, Globe } from 'lucide-react'
import { Sheet } from './ui'
import { useStore } from '../store/useStore'
import { useToast } from './Toast'
import { CURRENCIES, DEFAULT_SCHEME } from '../data/constants'
import { formatUpdateTime } from '../services/exchangeRate'

/**
 * 实时汇率详情页
 *
 * 展示当前世界实时汇率，支持：
 * - 自动拉取 + 手动刷新
 * - 与默认/当前方案对比，标注涨跌
 * - 一键应用为当前方案
 */
export default function LiveRatesSheet({ open, onClose }) {
  const store = useStore()
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rates, setRates] = useState({})
  const [updatedAt, setUpdatedAt] = useState('')
  const [applying, setApplying] = useState(false)

  // 打开时自动拉取
  useEffect(() => {
    if (!open) return
    loadLiveRates(true)
  }, [open])

  const loadLiveRates = async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const result = await store.fetchLiveRates(force)
      setRates(result.rates)
      setUpdatedAt(result.updatedAt)
    } catch (e) {
      setError(e.message || '获取实时汇率失败')
    } finally {
      setLoading(false)
    }
  }

  // 一键应用为当前方案
  const handleApply = async () => {
    setApplying(true)
    try {
      const id = store.addScheme({
        name: `实时汇率 ${new Date().toLocaleDateString('zh-CN')}`,
        rates,
        liveUpdatedAt: new Date().toISOString(),
      })
      store.setActiveScheme(id)
      toast.show('已应用实时汇率方案')
      onClose()
    } catch (e) {
      toast.show('应用失败，请重试')
    } finally {
      setApplying(false)
    }
  }

  // 当前激活方案的汇率，用于对比
  const activeScheme = store.schemes.find((s) => s.id === store.settings.activeSchemeId) || DEFAULT_SCHEME

  return (
    <Sheet open={open} onClose={onClose} title="实时汇率" maxHeight="90vh">
      {/* 顶部状态条 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(78,205,196,0.12), rgba(126,212,198,0.06))',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          border: '1px solid rgba(78,205,196,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color="var(--color-primary-dark)" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              国际实时汇率
            </span>
          </div>
          <button
            onClick={() => loadLiveRates(true)}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 10,
              background: 'rgba(78,205,196,0.18)',
              color: 'var(--color-primary-dark)',
              fontSize: 12,
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            刷新
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          {loading ? (
            <>
              <RefreshCw size={13} color="var(--color-primary)" className="spin" />
              <span style={{ color: 'var(--color-primary)' }}>正在获取最新汇率…</span>
            </>
          ) : error ? (
            <>
              <WifiOff size={13} color="var(--color-expense)" />
              <span style={{ color: 'var(--color-expense)' }}>获取失败 · {error}</span>
            </>
          ) : (
            <>
              <Wifi size={13} color="var(--color-primary-dark)" />
              <span style={{ color: 'var(--text-secondary)' }}>
                {updatedAt ? `更新于 ${formatUpdateTime(updatedAt)}` : '已就绪'}
              </span>
            </>
          )}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.5 }}>
          数据源：open.er-api.com · 基于国际真实汇率 · 每日更新
        </div>
      </div>

      {/* 汇率列表 */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>1 该币 = ? CNY</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>对比当前方案</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {CURRENCIES.map((c) => {
          const liveVal = rates[c.code]
          const curVal = activeScheme.rates?.[c.code] ?? DEFAULT_SCHEME.rates[c.code]
          const hasLive = liveVal !== undefined
          const diff = hasLive ? +(liveVal - curVal).toFixed(4) : 0
          const isUp = diff > 0
          const isDown = diff < 0
          const isBase = c.code === 'CNY'
          return (
            <div
              key={c.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 12,
                background: isBase ? 'rgba(78,205,196,0.06)' : 'rgba(0,0,0,0.02)',
                border: isBase ? '1px solid rgba(78,205,196,0.15)' : '1px solid transparent',
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 36,
                  borderRadius: 9,
                  background: 'rgba(78,205,196,0.1)',
                  color: 'var(--color-primary-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {c.code}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {isBase ? '基准货币' : `当前方案 ${curVal}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {loading && !hasLive ? (
                  <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>…</span>
                ) : hasLive ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                      {liveVal}
                    </div>
                    {!isBase && diff !== 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          marginTop: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 2,
                          color: isUp ? 'var(--color-income)' : 'var(--color-expense)',
                        }}
                      >
                        <TrendingUp size={9} style={{ transform: isDown ? 'rotate(180deg)' : 'none' }} />
                        {isUp ? '+' : ''}{diff}
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>—</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 错误重试 */}
      {error && (
        <button
          onClick={() => loadLiveRates(true)}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 12,
            background: 'rgba(255,107,107,0.1)',
            color: 'var(--color-expense)',
            fontWeight: 600,
            fontSize: 14,
            border: '1px solid rgba(255,107,107,0.2)',
            marginTop: 14,
            cursor: 'pointer',
          }}
        >
          重试获取实时汇率
        </button>
      )}

      {/* 应用按钮 */}
      {!error && Object.keys(rates).length > 0 && (
        <button
          onClick={handleApply}
          disabled={applying || loading}
          style={{
            width: '100%',
            padding: '15px 0',
            borderRadius: 14,
            background: 'linear-gradient(135deg,#7EDDD7,#4ECDC4)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 15,
            marginTop: 16,
            boxShadow: '0 6px 18px rgba(78,205,196,0.35)',
            border: 'none',
            opacity: applying || loading ? 0.6 : 1,
            cursor: applying || loading ? 'not-allowed' : 'pointer',
          }}
        >
          {applying ? '应用中…' : '应用此实时汇率为当前方案'}
        </button>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Sheet>
  )
}
