import { useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Camera, StickyNote, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useToast } from '../components/Toast'
import NumberPad from '../components/NumberPad'
import SettingsSheet from '../components/SettingsSheet'
import CurrencyPicker from '../components/CurrencyPicker'
import { Sheet, ProgressBar } from '../components/ui'
import { CategoryIcon, AccountIcon } from '../data/icons'
import { TX, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCY_MAP } from '../data/constants'
import { yuanToFen, fenToYuan, withCommas, friendlyDate } from '../utils/format'
import { convertFen } from '../utils/currency'
import {
  todayExpense,
  weekExpense,
  monthExpense,
  weekDailyExpenses,
  activeScheme,
} from '../utils/stats'

export default function Record() {
  const store = useStore()
  const toast = useToast()
  const [showSettings, setShowSettings] = useState(false)
  const [showCurrency, setShowCurrency] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [showNote, setShowNote] = useState(false)

  // 记账货币从持久化的 recordCurrency 读取，保证刷新/重挂载后仍保持上次选择
  const [draft, setDraft] = useState({
    type: TX.EXPENSE,
    amount: '',
    categoryId: null,
    accountId: 'wechat',
    currency: store.settings.recordCurrency || store.settings.currency,
    note: '',
    photos: [],
  })

  const fileRef = useRef(null)
  const noteRef = useRef(null)

  const categories = draft.type === TX.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const symbol = CURRENCY_MAP[draft.currency]?.symbol || '¥'
  const scheme = activeScheme(store)
  // 主显示货币（汇总卡 / 预算条用）
  const dispCur = store.settings.currency
  const dispSymbol = store.settings.currencySymbol
  // 转换目标货币：持久化在 settings.convertCurrency
  const convertCur = store.settings.convertCurrency || store.settings.currency
  const convertSymbol = CURRENCY_MAP[convertCur]?.symbol || '¥'

  // 换算预览：记账货币 → 转换目标货币
  const convertedFen = useMemo(() => {
    if (!draft.amount) return 0
    return convertFen(yuanToFen(draft.amount), draft.currency, convertCur, scheme)
  }, [draft.amount, draft.currency, convertCur, scheme])

  const setType = (type) =>
    setDraft((d) => ({ ...d, type, categoryId: null }))

  const handleConfirm = () => {
    const fen = yuanToFen(draft.amount)
    if (!fen) {
      toast.show('请输入金额')
      return
    }
    if (!draft.categoryId && draft.type !== TX.TRANSFER) {
      toast.show('请选择一个分类')
      return
    }
    const record = store.addRecord({
      type: draft.type,
      amount: fen,
      currency: draft.currency,
      categoryId: draft.categoryId,
      accountId: draft.accountId,
      note: draft.note,
    })
    draft.photos.forEach((p) => store.addPhoto(record.id, p))

    // 重置（保留类型与账户）
    setDraft((d) => ({
      ...d,
      amount: '',
      categoryId: null,
      note: '',
      photos: [],
    }))

    const saved = fenToYuan(fen)
    toast.show(`${draft.type === TX.INCOME ? '已记收入' : '已记支出'} ${symbol}${saved}`, {
      duration: 3000,
      action: {
        label: '撤销',
        onClick: () => {
          store.deleteRecord(record.id)
          toast.show('已撤销')
        },
      },
    })
  }

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      const dataUrl = await readFileAsDataURL(file)
      setDraft((d) => ({ ...d, photos: [...d.photos, dataUrl] }))
    }
    e.target.value = ''
  }

  // 顶部汇总
  const today = todayExpense(store)
  const week = weekExpense(store)
  const month = monthExpense(store)
  const weekDays = weekDailyExpenses(store)

  // 预算
  const budget = store.getBudget('monthly')
  const budgetPct = budget ? Math.min(100, (month / budget) * 100) : 0
  const budgetLeft = Math.max(0, budget - month)
  const budgetLeftPct = budget ? Math.round((budgetLeft / budget) * 100) : 100

  return (
    <div style={{ padding: '0 16px' }}>
      {/* 头部 */}
      <div
        className="safe-top"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: 2,
                background: 'linear-gradient(135deg,#3DBFB5,#4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              轻 记
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            记账 · 拍照 · 换币
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'var(--card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow)',
            color: 'var(--text-secondary)',
          }}
        >
          <SettingsIcon size={18} />
        </button>
      </div>

      {/* 汇总卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4ECDC4 0%, #3DBFB5 100%)',
          borderRadius: 22,
          padding: 18,
          color: '#fff',
          boxShadow: '0 10px 30px rgba(78,205,196,0.3)',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.85 }}>花在哪里都清楚</div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 14,
          }}
        >
          <SummaryMini label="今日支出" value={dispSymbol + withCommas(fenToYuan(today))} />
          <SummaryMini label="本周支出" value={dispSymbol + withCommas(fenToYuan(week))} />
          <SummaryMini label="本月支出" value={dispSymbol + withCommas(fenToYuan(month))} />
        </div>
      </div>

      {/* 周日历条 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 14,
          padding: '0 2px',
        }}
      >
        {weekDays.map((d, i) => {
          const date = new Date(d.date)
          const isToday = d.date === new Date().toISOString().slice(0, 10)
          const wd = ['一', '二', '三', '四', '五', '六', '日'][i]
          return (
            <div
              key={d.date}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                }}
              >
                {wd}
              </span>
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {date.getDate()}
              </span>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: d.amount > 0 ? 'var(--color-expense)' : 'transparent',
                  opacity: d.future ? 0.2 : 1,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* 类型切换 */}
      <div style={{ marginTop: 18 }}>
        <TypeToggle value={draft.type} onChange={setType} />
      </div>

      {/* 分类 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 6,
          marginTop: 14,
        }}
      >
        {categories.map((c) => {
          const active = draft.categoryId === c.id
          return (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => setDraft((d) => ({ ...d, categoryId: c.id }))}
              className={`category-chip ${draft.type === TX.EXPENSE ? 'expense' : 'income'}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                padding: '8px 2px',
                borderRadius: 14,
                background: active ? `${c.color}18` : 'transparent',
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  background: active ? c.color : `${c.color}14`,
                  color: active ? '#fff' : c.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <CategoryIcon icon={c.icon} size={20} />
              </span>
              <span
                className="category-chip-name"
                style={{
                  fontSize: 11,
                  color: active ? 'var(--text)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {c.name}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* 拍照 + 备注 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
        }}
      >
        <ActionPill
          icon={<Camera size={16} />}
          label={
            draft.photos.length ? `照片 ${draft.photos.length}` : '拍照'
          }
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          style={{ display: 'none' }}
          onChange={handlePhoto}
        />
        <ActionPill
          icon={<StickyNote size={16} />}
          label={draft.note ? draft.note : '备注'}
          active={!!draft.note}
          onClick={() => setShowNote(true)}
        />
      </div>

      {draft.photos.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }} className="no-scrollbar">
          {draft.photos.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                width: 56,
                height: 56,
                borderRadius: 10,
                overflow: 'hidden',
                flexShrink: 0,
              }}
              className="record-photo-thumb"
            >
              <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* 账户 */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8, paddingLeft: 2 }}>
          账户
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
          {store.accounts.map((a) => {
            const active = draft.accountId === a.id
            return (
              <button
                key={a.id}
                className={`account-chip ${active ? 'active' : ''}`}
                onClick={() => setDraft((d) => ({ ...d, accountId: a.id }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: active ? `${a.color}18` : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${active ? a.color : 'transparent'}`,
                  flexShrink: 0,
                }}
              >
                <AccountIcon icon={a.icon} size={15} color={a.color} />
                <span style={{ fontSize: 12, fontWeight: 500, color: active ? a.color : 'var(--text-secondary)' }}>
                  {a.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 预算迷你条 */}
      {budget > 0 && (
        <div className="budget-bar" style={{ marginTop: 14, padding: '12px 14px', borderRadius: 16, background: 'var(--card)', boxShadow: 'var(--shadow)' }}>
          <div className="budget-bar-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="budget-bar-label" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>本月预算</span>
            <span className="budget-bar-value" style={{ fontSize: 12, fontWeight: 600 }}>
              {dispSymbol}{withCommas(fenToYuan(month))} / {dispSymbol}{withCommas(fenToYuan(budget))}
            </span>
          </div>
          <ProgressBar
            percent={budgetPct}
            color={budgetPct >= 100 ? 'var(--color-expense)' : 'var(--color-primary)'}
          />
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
            {budgetLeft > 0
              ? `比预算少花了这些，真不错 · 预算还剩 ${budgetLeftPct}%`
              : `本月支出已超出预算`}
          </div>
        </div>
      )}

      {/* 金额显示 + 货币 */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 2 }}>记账</span>
          <button
            onClick={() => setShowCurrency(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(78,205,196,0.1)',
              color: 'var(--color-primary-dark)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {draft.currency}
            <ChevronDown size={13} />
          </button>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>→</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 2 }}>转为</span>
          <button
            onClick={() => setShowConvert(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 8,
              background: 'rgba(255,159,67,0.12)',
              color: '#E08A2B',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {convertCur}
            <ChevronDown size={13} />
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 20, color: 'var(--text-tertiary)' }}>{symbol}</span>
          <motion.span
            key={draft.amount}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1 }}
          >
            {draft.amount || '0'}
          </motion.span>
          {draft.currency !== convertCur && convertedFen > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              ≈ {convertSymbol}{withCommas(fenToYuan(convertedFen))}
            </span>
          )}
        </div>
      </div>

      {/* 数字键盘 */}
      <NumberPad
        value={draft.amount}
        onChange={(v) => setDraft((d) => ({ ...d, amount: v }))}
        onConfirm={handleConfirm}
        confirmLabel={draft.type === TX.INCOME ? '记收入' : '记支出'}
      />

      {/* 备注 Sheet */}
      <Sheet open={showNote} onClose={() => setShowNote(false)} title="备注">
        <textarea
          ref={noteRef}
          value={draft.note}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          placeholder="写点什么…"
          autoFocus
          style={{
            width: '100%',
            minHeight: 100,
            fontSize: 15,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(0,0,0,0.02)',
            resize: 'none',
          }}
        />
        <button
          onClick={() => setShowNote(false)}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 14,
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 600,
            marginTop: 12,
          }}
        >
          完成
        </button>
      </Sheet>

      {/* 记账货币选择（持久化到 recordCurrency，保持固定直到主动更换） */}
      <Sheet open={showCurrency} onClose={() => setShowCurrency(false)} title="记账货币">
        <CurrencyPicker
          value={draft.currency}
          onChange={(code) => {
            setDraft((d) => ({ ...d, currency: code }))
            store.updateSettings({ recordCurrency: code })
            setShowCurrency(false)
          }}
          title="选择记账时的货币（选择后保持，直到更换）"
        />
      </Sheet>

      {/* 转换目标货币选择（持久化到 convertCurrency） */}
      <Sheet open={showConvert} onClose={() => setShowConvert(false)} title="转换目标货币">
        <CurrencyPicker
          value={convertCur}
          onChange={(code) => {
            store.updateSettings({ convertCurrency: code })
            setShowConvert(false)
          }}
          title="选择要换算展示的目标币种"
        />
      </Sheet>

      <SettingsSheet open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

function SummaryMini({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function TypeToggle({ value, onChange }) {
  const opts = [
    { value: TX.EXPENSE, label: '支出' },
    { value: TX.INCOME, label: '收入' },
  ]
  return (
    <div
      style={{
        display: 'flex',
        background: 'rgba(0,0,0,0.04)',
        borderRadius: 12,
        padding: 3,
      }}
    >
      {opts.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 14,
              fontWeight: 600,
              color: active ? '#fff' : 'var(--text-secondary)',
              borderRadius: 9,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {active && (
              <motion.div
                layoutId="type-active"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    o.value === TX.EXPENSE
                      ? 'linear-gradient(135deg,#FF8A8A,#FF6B6B)'
                      : 'linear-gradient(135deg,#5BCF6E,#4CAF50)',
                  borderRadius: 9,
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function ActionPill({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 999,
        background: active ? 'rgba(78,205,196,0.12)' : 'rgba(0,0,0,0.03)',
        color: active ? 'var(--color-primary-dark)' : 'var(--text-secondary)',
        fontSize: 13,
        fontWeight: 500,
        flex: 1,
        justifyContent: 'center',
      }}
    >
      {icon}
      <span
        style={{
          maxWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </button>
  )
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
