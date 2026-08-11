import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, Trash2, Check, Plus, RefreshCw, Camera } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import { Sheet, EmptyState, Segmented } from '../components/ui'
import SchemeEditorSheet from '../components/SchemeEditorSheet'
import NumberPad from '../components/NumberPad'
import { CategoryIcon, AccountIcon } from '../data/icons'
import { TX, TX_LABEL, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCY_MAP, CURRENCIES } from '../data/constants'
import { fenToYuan, withCommas, friendlyDate, monthLabel, todayStr } from '../utils/format'
import { convertRecordAmount } from '../utils/currency'
import { activeScheme, sumByType } from '../utils/stats'
import { ListChecks, Globe } from 'lucide-react'
import { formatUpdateTime } from '../services/exchangeRate'
import PhotoViewer from '../components/PhotoViewer'
import LiveRatesSheet from '../components/LiveRatesSheet'

export default function Records() {
  const store = useStore()
  const toast = useToast()
  const [cursor, setCursor] = useState(new Date())
  const [filter, setFilter] = useState('all') // all | expense | income
  const [schemeOpen, setSchemeOpen] = useState(false)
  const [schemeEditorOpen, setSchemeEditorOpen] = useState(false)
  const [liveRatesOpen, setLiveRatesOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editing, setEditing] = useState(null) // record id
  // 每天的展示币种覆盖：{ [dateStr]: currencyCode }，未设置则跟随主货币 cur
  const [dayCurrency, setDayCurrency] = useState({})

  const scheme = activeScheme(store)
  const cur = store.settings.currency
  const symbol = store.settings.currencySymbol

  // 当前月份范围
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
  const end = `${y}-${String(m + 1).padStart(2, '0')}-31`

  const monthRecords = useMemo(() => {
    return store.records
      .filter((r) => r.date >= start && r.date <= end)
      .filter((r) => (filter === 'all' ? true : r.type === filter))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.time || '') > (a.time || '') ? 1 : -1))
  }, [store.records, start, end, filter])

  // 按日期分组
  const groups = useMemo(() => {
    const map = {}
    monthRecords.forEach((r) => {
      ;(map[r.date] = map[r.date] || []).push(r)
    })
    return Object.entries(map)
  }, [monthRecords])

  const monthExpense = sumByType(
    store.records.filter((r) => r.date >= start && r.date <= end),
    TX.EXPENSE,
    cur,
    scheme
  )
  const monthIncome = sumByType(
    store.records.filter((r) => r.date >= start && r.date <= end),
    TX.INCOME,
    cur,
    scheme
  )

  const moveMonth = (delta) => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + delta)
    setCursor(d)
  }

  const editingRecord = store.records.find((r) => r.id === editing)

  return (
    <div style={{ padding: '0 16px' }}>
      <Header title="明细" subtitle="选择范围、设置汇率、明细中实时切换" />

      {/* 月份导航 + 方案 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => moveMonth(-1)} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, minWidth: 90, textAlign: 'center' }}>{monthLabel(cursor)}</span>
          <button onClick={() => moveMonth(1)} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={() => setSchemeOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'rgba(78,205,196,0.1)',
            color: 'var(--color-primary-dark)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {scheme?.name} <ChevronDown size={13} />
        </button>
      </div>

      {/* 月度汇总 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <SummaryCard label="支出" value={`${symbol}${withCommas(fenToYuan(monthExpense))}`} color="var(--color-expense)" />
        <SummaryCard label="收入" value={`${symbol}${withCommas(fenToYuan(monthIncome))}`} color="var(--color-income)" />
        <SummaryCard label="结余" value={`${symbol}${withCommas(fenToYuan(monthIncome - monthExpense))}`} color="var(--color-primary)" />
      </div>

      {/* 筛选 */}
      <div style={{ marginTop: 14 }}>
        <Segmented
          options={[
            { value: 'all', label: '全部' },
            { value: 'expense', label: '支出' },
            { value: 'income', label: '收入' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {/* 列表 */}
      <div style={{ marginTop: 14 }}>
        {groups.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={30} />}
            title="还没有记账记录"
            subtitle="点击下方「记账」开始记录第一笔"
          />
        ) : (
          groups.map(([date, recs]) => {
            // 该天的展示币种：未覆盖则跟随主货币
            const dayCur = dayCurrency[date] || cur
            const daySymbol = CURRENCY_MAP[dayCur]?.symbol || '¥'
            const dayExp = recs.filter((r) => r.type === TX.EXPENSE).reduce((a, r) => a + convertRecordAmount(r, dayCur, scheme), 0)
            const dayInc = recs.filter((r) => r.type === TX.INCOME).reduce((a, r) => a + convertRecordAmount(r, dayCur, scheme), 0)
            return (
              <div key={date} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px 8px', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{friendlyDate(date)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {dayExp > 0 && <span style={{ color: 'var(--color-expense)' }}>-{daySymbol}{withCommas(fenToYuan(dayExp))}</span>}
                      {dayExp > 0 && dayInc > 0 && ' · '}
                      {dayInc > 0 && <span style={{ color: 'var(--color-income)' }}>+{daySymbol}{withCommas(fenToYuan(dayInc))}</span>}
                    </span>
                    {/* 每天币种下拉：把这一整天的价格统一为所选币种 */}
                    <DayCurrencySelect
                      value={dayCur}
                      mainCur={cur}
                      onChange={(code) => setDayCurrency((m) => ({ ...m, [date]: code }))}
                    />
                  </div>
                </div>
                <div style={{ background: 'var(--card)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                  {recs.map((r, idx) => (
                    <RecordRow
                      key={r.id}
                      record={r}
                      store={store}
                      displayCur={dayCur}
                      isLast={idx === recs.length - 1}
                      onClick={() => setEditing(r.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 方案切换 */}
      <Sheet open={schemeOpen} onClose={() => setSchemeOpen(false)} title="汇率方案">
        {/* 实时汇率入口卡片（醒目置顶） */}
        <button
          onClick={() => {
            setSchemeOpen(false)
            setLiveRatesOpen(true)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(126,212,198,0.08))',
            border: '1px solid rgba(78,205,196,0.3)',
            width: '100%',
            marginBottom: 12,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7EDDD7, #4ECDC4)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(78,205,196,0.35)',
            }}
          >
            <Globe size={22} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              🌐 实时汇率
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              查看世界实时汇率 · 一键应用
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--color-primary-dark)', fontWeight: 700 }}>查看 →</span>
        </button>

        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>
          自定义方案 · 点击切换
        </div>
        {store.schemes.map((s) => {
          const active = s.id === store.settings.activeSchemeId
          return (
            <button
              key={s.id}
              onClick={() => {
                store.setActiveScheme(s.id)
                setSchemeOpen(false)
                toast.show('已切换汇率方案')
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 14px',
                borderRadius: 14,
                background: active ? 'rgba(78,205,196,0.1)' : 'rgba(0,0,0,0.02)',
                marginBottom: 6,
                width: '100%',
                border: active ? '1px solid rgba(78,205,196,0.3)' : '1px solid transparent',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {Object.entries(s.rates).slice(0, 4).map(([k, v]) => `${k}:${v}`).join('  ')}
                </div>
              </div>
              {active && <Check size={18} color="var(--color-primary)" />}
            </button>
          )
        })}

        {/* 新建方案入口 */}
        <button
          onClick={() => {
            setSchemeOpen(false)
            setSchemeEditorOpen(true)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '13px 14px',
            borderRadius: 14,
            background: 'rgba(78,205,196,0.08)',
            border: '1px dashed rgba(78,205,196,0.45)',
            width: '100%',
            color: 'var(--color-primary-dark)',
            fontSize: 14,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          <Plus size={18} />
          新建汇率方案（实时拉取）
        </button>

        {/* 刷新当前方案为实时汇率 */}
        <button
          onClick={async () => {
            setRefreshing(true)
            try {
              await store.refreshActiveSchemeRates()
              toast.show('已用实时汇率更新当前方案')
              setSchemeOpen(false)
            } catch (e) {
              toast.show('获取实时汇率失败，请稍后重试')
            } finally {
              setRefreshing(false)
            }
          }}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.06)',
            width: '100%',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 600,
            marginTop: 6,
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
          {refreshing ? '正在获取实时汇率…' : '刷新当前方案为实时汇率'}
        </button>

        {/* 当前方案实时更新时间 */}
        {scheme?.liveUpdatedAt && (
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
            实时汇率更新于 {formatUpdateTime(scheme.liveUpdatedAt)}
          </div>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin { animation: spin 1s linear infinite; }
        `}</style>
      </Sheet>

      {/* 新建方案编辑器 */}
      <SchemeEditorSheet
        open={schemeEditorOpen}
        onClose={() => setSchemeEditorOpen(false)}
      />

      {/* 实时汇率详情页 */}
      <LiveRatesSheet
        open={liveRatesOpen}
        onClose={() => setLiveRatesOpen(false)}
      />

      {/* 编辑 */}
      <EditRecordSheet
        record={editingRecord}
        open={!!editingRecord}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

function RecordRow({ record, store, displayCur, isLast, onClick }) {
  const scheme = activeScheme(store)
  const cur = displayCur || store.settings.currency
  const symbol = CURRENCY_MAP[cur]?.symbol || '¥'
  const cat = store.categories.find((c) => c.id === record.categoryId)
  const acct = store.accounts.find((a) => a.id === record.accountId)
  const amt = convertRecordAmount(record, cur, scheme)
  const isExp = record.type === TX.EXPENSE
  const isInc = record.type === TX.INCOME
  const photos = store.getPhotosForRecord(record.id)
  const color = cat?.color || 'var(--text-tertiary)'

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        width: '100%',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${color}14`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <CategoryIcon icon={cat?.icon || 'other'} size={20} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{cat?.name || TX_LABEL[record.type]}</span>
          {record.currency !== cur && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.04)', padding: '1px 5px', borderRadius: 4 }}>
              {record.currency}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {acct && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AccountIcon icon={acct.icon} size={11} /> {acct.name}
            </span>
          )}
          {record.note && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              · {record.note}
            </span>
          )}
          {photos.length > 0 && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>· 📷{photos.length}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: isExp ? 'var(--color-expense)' : isInc ? 'var(--color-income)' : 'var(--color-transfer)',
          }}
        >
          {isExp ? '-' : '+'}
          {symbol}{withCommas(fenToYuan(amt))}
        </div>
        {record.currency !== cur && (
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            原 {CURRENCY_MAP[record.currency]?.symbol}{withCommas(fenToYuan(record.amount))}
          </div>
        )}
      </div>
    </button>
  )
}

function EditRecordSheet({ record, open, onClose }) {
  const store = useStore()
  const toast = useToast()
  const [amount, setAmount] = useState('')
  const [type, setType] = useState(TX.EXPENSE)
  const [categoryId, setCategoryId] = useState(null)
  const [accountId, setAccountId] = useState(null)
  const [note, setNote] = useState('')
  const [photoViewIdx, setPhotoViewIdx] = useState(-1) // -1 表示未打开查看器

  // 当 record 变化时同步
  useMemo(() => {
    if (record) {
      setAmount(fenToYuan(record.amount).replace(/\.00$/, ''))
      setType(record.type)
      setCategoryId(record.categoryId)
      setAccountId(record.accountId)
      setNote(record.note || '')
    }
  }, [record])

  if (!record) return null

  const photos = store.getPhotosForRecord(record.id)

  const categories = type === TX.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSave = () => {
    const fen = Math.round(parseFloat(amount || '0') * 100)
    if (!fen) {
      toast.show('请输入金额')
      return
    }
    store.updateRecord(record.id, { amount: fen, type, categoryId, accountId, note })
    toast.show('已更新')
    onClose()
  }

  const handleDelete = () => {
    store.deleteRecord(record.id)
    toast.show('已删除', {
      duration: 3000,
      action: { label: '撤销', onClick: () => store.undoDelete() },
    })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="编辑记录" maxHeight="88vh">
      {/* 类型 */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: 12, padding: 3, marginBottom: 14 }}>
        {[{ v: TX.EXPENSE, l: '支出' }, { v: TX.INCOME, l: '收入' }].map((o) => {
          const active = type === o.v
          return (
            <button
              key={o.v}
              onClick={() => { setType(o.v); setCategoryId(null) }}
              style={{
                flex: 1,
                padding: '8px 0',
                fontSize: 14,
                fontWeight: 600,
                color: active ? '#fff' : 'var(--text-secondary)',
                borderRadius: 9,
                background: active ? (o.v === TX.EXPENSE ? 'var(--color-expense)' : 'var(--color-income)') : 'transparent',
              }}
            >
              {o.l}
            </button>
          )
        })}
      </div>

      {/* 金额 */}
      <div style={{ textAlign: 'center', padding: '8px 0 12px' }}>
        <span style={{ fontSize: 16, color: 'var(--text-tertiary)' }}>{CURRENCY_MAP[record.currency]?.symbol}</span>
        <span style={{ fontSize: 32, fontWeight: 700 }}>{amount || '0'}</span>
      </div>

      {/* 分类 */}
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>分类</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
        {categories.map((c) => {
          const active = categoryId === c.id
          return (
            <button
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 2px',
                borderRadius: 12,
                background: active ? `${c.color}18` : 'transparent',
              }}
            >
              <span style={{ width: 34, height: 34, borderRadius: 11, background: active ? c.color : `${c.color}14`, color: active ? '#fff' : c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CategoryIcon icon={c.icon} size={18} />
              </span>
              <span style={{ fontSize: 10, color: active ? 'var(--text)' : 'var(--text-secondary)' }}>{c.name}</span>
            </button>
          )
        })}
      </div>

      {/* 账户 */}
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>账户</div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14 }} className="no-scrollbar">
        {store.accounts.map((a) => {
          const active = accountId === a.id
          return (
            <button
              key={a.id}
              onClick={() => setAccountId(a.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 999,
                background: active ? `${a.color}18` : 'rgba(0,0,0,0.03)',
                border: `1px solid ${active ? a.color : 'transparent'}`,
                flexShrink: 0,
              }}
            >
              <AccountIcon icon={a.icon} size={14} color={a.color} />
              <span style={{ fontSize: 12, color: active ? a.color : 'var(--text-secondary)' }}>{a.name}</span>
            </button>
          )
        })}
      </div>

      {/* 备注 */}
      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>备注</div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="添加备注…"
        style={{ width: '100%', padding: 12, borderRadius: 12, background: 'rgba(0,0,0,0.02)', fontSize: 14 }}
      />

      {/* 照片 */}
      {photos.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Camera size={13} />
            照片 · {photos.length} 张 · 点击查看大图
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPhotoViewIdx(i)}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  overflow: 'hidden',
                  padding: 0,
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <img src={p.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 操作 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={handleDelete}
          style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,107,107,0.1)', color: 'var(--color-expense)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Trash2 size={20} />
        </button>
        <button
          onClick={handleSave}
          style={{ flex: 1, height: 48, borderRadius: 14, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 15 }}
        >
          保存
        </button>
      </div>

      {/* 数字键盘 */}
      <div style={{ marginTop: 12, marginLeft: -18, marginRight: -18, marginBottom: -18 }}>
        <NumberPad value={amount} onChange={setAmount} onConfirm={handleSave} confirmLabel="保存" />
      </div>

      {/* 全屏照片查看器 */}
      <PhotoViewer
        photos={photos}
        index={photoViewIdx}
        onClose={() => setPhotoViewIdx(-1)}
        onDelete={(photoId) => {
          store.removePhoto(photoId)
          toast.show('已删除照片')
          // 若删完则关闭查看器，否则调整索引
          const next = photos.filter((p) => p.id !== photoId)
          if (next.length === 0) setPhotoViewIdx(-1)
          else if (photoViewIdx >= next.length) setPhotoViewIdx(next.length - 1)
        }}
      />
    </Sheet>
  )
}

function Header({ title, subtitle }) {
  return (
    <div className="safe-top" style={{ paddingTop: 14 }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--card)', borderRadius: 14, padding: '12px 14px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color, marginTop: 3 }}>{value}</div>
    </div>
  )
}

/**
 * 每天币种下拉：把这一整天的价格统一为所选币种。
 * 使用原生 select 作为下拉，包含「跟随主货币」与全部币种。
 */
function DayCurrencySelect({ value, mainCur, onChange }) {
  const isFollowing = !value || value === mainCur
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <select
        value={isFollowing ? '__main__' : value}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '__main__' ? mainCur : v)
        }}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          padding: '3px 20px 3px 8px',
          paddingRight: 20,
          borderRadius: 7,
          border: '1px solid rgba(0,0,0,0.08)',
          background: isFollowing ? 'rgba(0,0,0,0.03)' : 'rgba(78,205,196,0.1)',
          color: isFollowing ? 'var(--text-tertiary)' : 'var(--color-primary-dark)',
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.4,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="__main__">跟随主货币</option>
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={11}
        style={{
          position: 'absolute',
          right: 5,
          pointerEvents: 'none',
          color: isFollowing ? 'var(--text-tertiary)' : 'var(--color-primary-dark)',
        }}
      />
    </div>
  )
}
