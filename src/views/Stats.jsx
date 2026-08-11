import { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis,
  Tooltip, CartesianGrid,
} from 'recharts'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import { Segmented, EmptyState, ProgressBar } from '../components/ui'
import { CategoryIcon } from '../data/icons'
import { TX } from '../data/constants'
import { fenToYuan, withCommas, dayLabel, weekRangeLabel, monthLabel, startOfWeek, startOfMonth, startOfDay, toDateStr, pad } from '../utils/format'
import { activeScheme, sumByType, categoryBreakdown } from '../utils/stats'

const PERIODS = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '本年' },
]

export default function Stats() {
  const store = useStore()
  const [period, setPeriod] = useState('month')

  const scheme = activeScheme(store)
  const cur = store.settings.currency
  const symbol = store.settings.currencySymbol

  const { start, end, label } = useMemo(() => {
    const now = new Date()
    if (period === 'week') {
      return { start: toDateStr(startOfWeek(now)), end: toDateStr(now), label: weekRangeLabel(now) }
    }
    if (period === 'year') {
      return { start: `${now.getFullYear()}-01-01`, end: toDateStr(now), label: `${now.getFullYear()}年` }
    }
    return { start: toDateStr(startOfMonth(now)), end: toDateStr(now), label: monthLabel(now) }
  }, [period])

  const records = useMemo(
    () => store.records.filter((r) => r.date >= start && r.date <= end && r.type !== TX.TRANSFER),
    [store.records, start, end]
  )

  const totalExp = sumByType(records, TX.EXPENSE, cur, scheme)
  const totalInc = sumByType(records, TX.INCOME, cur, scheme)

  const expenseBreakdown = categoryBreakdown(records, TX.EXPENSE, store)
  const incomeBreakdown = categoryBreakdown(records, TX.INCOME, store)

  // 每日支出柱状
  const dailyData = useMemo(() => {
    const map = {}
    records.filter((r) => r.type === TX.EXPENSE).forEach((r) => {
      map[r.date] = (map[r.date] || 0) + (convert(r, cur, scheme) / 100)
    })
    // 填充区间
    const out = []
    const s = new Date(start)
    const e = new Date(end)
    const limit = period === 'year' ? 12 : 31
    let count = 0
    for (let d = new Date(s); d <= e && count < limit; d.setDate(d.getDate() + 1), count++) {
      const ds = toDateStr(d)
      if (period === 'year') {
        const mk = `${d.getMonth() + 1}月`
        const existing = out.find((x) => x.name === mk)
        const v = map[ds] || 0
        if (existing) existing.value += v
        else out.push({ name: mk, value: v })
      } else {
        out.push({ name: pad(d.getMonth() + 1) + '.' + pad(d.getDate()), value: map[ds] || 0 })
      }
    }
    return out
  }, [records, start, end, period, cur, scheme])

  const hasData = records.length > 0

  return (
    <div style={{ padding: '0 16px' }}>
      <div className="safe-top" style={{ paddingTop: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 800 }}>统计</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{label} · 已换算为 {cur}</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Segmented options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 size={30} />}
          title="暂无数据"
          subtitle="该时间段内还没有记账记录"
        />
      ) : (
        <>
          {/* 收支概览 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <OverviewCard
              icon={<TrendingDown size={16} color="#fff" />}
              bg="linear-gradient(135deg,#FF8A8A,#FF6B6B)"
              label="支出"
              value={`${symbol}${withCommas(fenToYuan(totalExp))}`}
            />
            <OverviewCard
              icon={<TrendingUp size={16} color="#fff" />}
              bg="linear-gradient(135deg,#5BCF6E,#4CAF50)"
              label="收入"
              value={`${symbol}${withCommas(fenToYuan(totalInc))}`}
            />
            <OverviewCard
              icon={<span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Σ</span>}
              bg="linear-gradient(135deg,#7EDDD7,#4ECDC4)"
              label="结余"
              value={`${symbol}${withCommas(fenToYuan(totalInc - totalExp))}`}
            />
          </div>

          {/* 支出分类饼图 */}
          <SectionCard title="支出分类" total={`${symbol}${withCommas(fenToYuan(totalExp))}`}>
            {expenseBreakdown.length === 0 ? (
              <EmptyHint text="暂无支出" />
            ) : (
              <>
                <div style={{ width: '100%', height: 200, position: 'relative' }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        dataKey="amount"
                        nameKey={(d) => d.category?.name}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {expenseBreakdown.map((b, i) => (
                          <Cell key={i} fill={b.category?.color || '#9CA3AF'} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => `${symbol}${withCommas(fenToYuan(v))}`}
                        contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>总支出</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{symbol}{withCommas(fenToYuan(totalExp))}</span>
                  </div>
                </div>
                <CategoryList breakdown={expenseBreakdown} symbol={symbol} />
              </>
            )}
          </SectionCard>

          {/* 每日支出柱状 */}
          <SectionCard title={`${period === 'year' ? '每月' : '每日'}支出`}>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} interval={period === 'year' ? 0 : 'preserveStartEnd'} />
                  <Tooltip
                    formatter={(v) => [`${symbol}${withCommas(v.toFixed(2))}`, '支出']}
                    cursor={{ fill: 'rgba(78,205,196,0.08)' }}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#4ECDC4" radius={[6, 6, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* 收入分类 */}
          {incomeBreakdown.length > 0 && (
            <SectionCard title="收入分类" total={`${symbol}${withCommas(fenToYuan(totalInc))}`}>
              <CategoryList breakdown={incomeBreakdown} symbol={symbol} />
            </SectionCard>
          )}
        </>
      )}
    </div>
  )
}

function convert(record, cur, scheme) {
  if (record.currency === cur) return record.amount
  return Math.round((record.amount * (scheme.rates[record.currency] || 1)) / (scheme.rates[cur] || 1))
}

function OverviewCard({ icon, bg, label, value }) {
  return (
    <div style={{ flex: 1, borderRadius: 16, padding: 12, background: 'var(--card)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        {icon}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function SectionCard({ title, total, children }) {
  return (
    <div style={{ marginTop: 14, background: 'var(--card)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        {total && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{total}</span>}
      </div>
      {children}
    </div>
  )
}

function CategoryList({ breakdown, symbol }) {
  const max = breakdown[0]?.amount || 1
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {breakdown.map((b) => (
        <div key={b.categoryId}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                background: `${b.category?.color}14`,
                color: b.category?.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CategoryIcon icon={b.category?.icon || 'other'} size={14} />
            </span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.category?.name || '其他'}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{symbol}{withCommas(fenToYuan(b.amount))}</span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', minWidth: 38, textAlign: 'right' }}>{b.percent.toFixed(1)}%</span>
          </div>
          <ProgressBar percent={(b.amount / max) * 100} color={b.category?.color} height={5} />
        </div>
      ))}
    </div>
  )
}

function EmptyHint({ text }) {
  return <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: '30px 0' }}>{text}</div>
}
