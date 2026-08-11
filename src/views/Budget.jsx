import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, Pencil, Target, TrendingDown, AlertTriangle } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { Segmented, ProgressBar, EmptyState } from '../components/ui'
import NumberPad from '../components/NumberPad'
import { Sheet } from '../components/ui'
import { TX, BUDGET_PERIODS } from '../data/constants'
import { fenToYuan, withCommas, toDateStr, startOfDay, startOfWeek, startOfMonth, pad, friendlyDate } from '../utils/format'
import { activeScheme, sumByType } from '../utils/stats'

const PERIOD_OPTS = BUDGET_PERIODS.map((p) => ({ value: p.period || p.value, label: p.name }))

export default function Budget() {
  const store = useStore()
  const toast = useToast()
  const [period, setPeriod] = useState('monthly')
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')

  const scheme = activeScheme(store)
  const cur = store.settings.currency
  const symbol = store.settings.currencySymbol

  const budget = store.getBudget(period)

  // 周期范围与天数
  const { start, end, totalDays, passedDays, leftDays } = useMemo(() => {
    const now = new Date()
    if (period === 'daily') {
      return { start: toDateStr(now), end: toDateStr(now), totalDays: 1, passedDays: 1, leftDays: 0 }
    }
    if (period === 'weekly') {
      const s = startOfWeek(now)
      const e = new Date(s)
      e.setDate(s.getDate() + 6)
      const passed = Math.floor((startOfDay(now) - s) / 86400000) + 1
      return { start: toDateStr(s), end: toDateStr(e), totalDays: 7, passedDays: passed, leftDays: 7 - passed }
    }
    // monthly
    const s = startOfMonth(now)
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const passed = now.getDate()
    return { start: toDateStr(s), end: toDateStr(e), totalDays: e.getDate(), passedDays: passed, leftDays: e.getDate() - passed }
  }, [period])

  const spent = sumByType(
    store.records.filter((r) => r.date >= start && r.date <= end),
    TX.EXPENSE,
    cur,
    scheme
  )

  const pct = budget ? Math.min(999, (spent / budget) * 100) : 0
  const over = spent > budget && budget > 0
  const left = budget - spent
  const dailyAvailable = leftDays > 0 ? Math.max(0, left) / leftDays : left

  const openEdit = () => {
    setAmount(budget ? String(fenToYuan(budget)).replace(/\.00$/, '') : '')
    setEditing(true)
  }

  const saveBudget = () => {
    const fen = Math.round(parseFloat(amount || '0') * 100)
    store.setBudget(period, fen)
    setEditing(false)
    toast.show('预算已更新')
  }

  // 趋势：本周每日
  const trend = useMemo(() => {
    const s = startOfWeek(new Date())
    const arr = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(s)
      d.setDate(s.getDate() + i)
      const ds = toDateStr(d)
      const amt = sumByType(store.records.filter((r) => r.date === ds), TX.EXPENSE, cur, scheme)
      arr.push({ date: ds, amount: amt, label: ['一', '二', '三', '四', '五', '六', '日'][i] })
    }
    return arr
  }, [store.records, cur, scheme])

  return (
    <div style={{ padding: '0 16px' }}>
      <div className="safe-top" style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>预算</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>设定目标，量入为出</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Segmented options={PERIOD_OPTS} value={period} onChange={setPeriod} />
      </div>

      {/* 主预算卡 */}
      <motion.div
        key={period}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginTop: 14,
          borderRadius: 22,
          padding: 20,
          background: over
            ? 'linear-gradient(135deg, #FF8A8A 0%, #FF6B6B 100%)'
            : 'linear-gradient(135deg, #4ECDC4 0%, #3DBFB5 100%)',
          color: '#fff',
          boxShadow: over ? '0 10px 30px rgba(255,107,107,0.3)' : '0 10px 30px rgba(78,205,196,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              {PERIOD_OPTS.find((p) => p.value === period)?.label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, letterSpacing: -1 }}>
              {symbol}{withCommas(fenToYuan(spent))}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              / {symbol}{withCommas(fenToYuan(budget || 0))}
            </div>
          </div>
          <button
            onClick={openEdit}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pencil size={16} />
          </button>
        </div>

        <div style={{ marginTop: 16, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, pct)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', background: '#fff', borderRadius: 4 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, opacity: 0.9 }}>
          <span>{pct.toFixed(0)}% 已用</span>
          <span>{leftDays} 天剩余</span>
        </div>
      </motion.div>

      {/* 提醒 */}
      {budget > 0 && (
        <div
          style={{
            marginTop: 12,
            background: 'var(--card)',
            borderRadius: 16,
            padding: 14,
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: over ? 'rgba(255,107,107,0.12)' : 'rgba(78,205,196,0.12)',
              color: over ? 'var(--color-expense)' : 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {over ? <AlertTriangle size={20} /> : <PiggyBank size={20} />}
          </span>
          <div style={{ flex: 1 }}>
            {over ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-expense)' }}>
                  {period === 'daily' ? '今日支出已超出预算' : period === 'weekly' ? '本周支出已超出预算' : '本月支出已超出预算'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  超出 {symbol}{withCommas(fenToYuan(spent - budget))}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {leftDays > 0 ? `还可支配 ${symbol}${withCommas(fenToYuan(left))}` : `比预算少花了这些，真不错`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {leftDays > 0
                    ? `日均可用 ${symbol}${withCommas(fenToYuan(dailyAvailable))} · 预算还剩 ${Math.round((left / budget) * 100)}%`
                    : `预算还剩 0%`}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 日均参考 */}
      {budget > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <MiniStat
            icon={<Target size={15} />}
            label="日均预算"
            value={`${symbol}${withCommas(fenToYuan(budget / totalDays))}`}
          />
          <MiniStat
            icon={<TrendingDown size={15} />}
            label="日均支出"
            value={`${symbol}${withCommas(fenToYuan(passedDays ? spent / passedDays : 0))}`}
          />
          <MiniStat
            icon={<PiggyBank size={15} />}
            label="累计结余"
            value={`${symbol}${withCommas(fenToYuan(left))}`}
            color={left < 0 ? 'var(--color-expense)' : 'var(--color-income)'}
          />
        </div>
      )}

      {/* 本周趋势 */}
      <div style={{ marginTop: 14, background: 'var(--card)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>本周每日支出</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, gap: 6 }}>
          {trend.map((d) => {
            const max = Math.max(...trend.map((x) => x.amount), 1)
            const h = (d.amount / max) * 80
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                  {d.amount > 0 ? fenToYuan(d.amount) : ''}
                </div>
                <div style={{ width: '70%', height: 90, display: 'flex', alignItems: 'flex-end' }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: Math.max(4, h) }}
                    transition={{ duration: 0.5 }}
                    style={{
                      width: '100%',
                      borderRadius: 4,
                      background: d.amount > 0 ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 编辑预算 */}
      <Sheet open={editing} onClose={() => setEditing(false)} title="设置预算">
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {PERIOD_OPTS.find((p) => p.value === period)?.label} · {symbol}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{amount || '0'}</div>
        </div>
        <div style={{ marginLeft: -18, marginRight: -18, marginBottom: -18 }}>
          <NumberPad value={amount} onChange={setAmount} onConfirm={saveBudget} confirmLabel="保存预算" />
        </div>
      </Sheet>
    </div>
  )
}

function MiniStat({ icon, label, value, color = 'var(--text)' }) {
  return (
    <div style={{ flex: 1, background: 'var(--card)', borderRadius: 14, padding: 12, boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
        {icon}
        <span style={{ fontSize: 11 }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 5, color }}>{value}</div>
    </div>
  )
}
