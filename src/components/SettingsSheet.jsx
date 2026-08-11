import { useState, useRef } from 'react'
import { Sheet } from './ui'
import CurrencyPicker from './CurrencyPicker'
import { useStore } from '../store/useStore'
import { useToast } from './Toast'
import { CURRENCIES, DEFAULT_SCHEME } from '../data/constants'
import { downloadBackup, downloadMarkdownReport, parseBackup } from '../utils/backup'
import { startOfMonth, toDateStr } from '../utils/format'
import { Download, Upload, FileText, Trash2, Plus, ChevronRight } from 'lucide-react'

export default function SettingsSheet({ open, onClose }) {
  const store = useStore()
  const toast = useToast()
  const [picker, setPicker] = useState(null) // 'currency' | null
  const fileRef = useRef(null)

  const scheme =
    store.schemes.find((s) => s.id === store.settings.activeSchemeId) ||
    store.schemes[0]

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = parseBackup(text)
      store.importData(data)
      toast.show('备份已导入')
      onClose()
    } catch (err) {
      toast.show('导入失败：文件格式不正确')
    } finally {
      e.target.value = ''
    }
  }

  const handleClear = () => {
    if (confirm('确定清空所有记账记录吗？此操作不可恢复。')) {
      store.clearAll()
      toast.show('已清空记录')
      onClose()
    }
  }

  const monthStart = toDateStr(startOfMonth(new Date()))
  const today = toDateStr(new Date())

  return (
    <Sheet open={open} onClose={onClose} title="设置">
      {/* 主货币 */}
      <Section title="主显示货币">
        <Row
          label={CURRENCIES.find((c) => c.code === store.settings.currency)?.name || '人民币'}
          desc={`金额将换算为该货币展示 · ${store.settings.currencySymbol}`}
          onClick={() => setPicker('currency')}
        />
      </Section>

      {/* 汇率方案 */}
      <Section title="汇率方案">
        <Row
          label={scheme?.name || '默认汇率'}
          desc="在明细页下拉栏中切换查看"
          onClick={() => {
            toast.show('可在明细页顶部切换方案', { duration: 1800 })
            onClose()
          }}
        />
      </Section>

      {/* 预算提醒 */}
      <Section title="提醒">
        <ToggleRow
          label="预算超支提醒"
          checked={store.settings.budgetAlert}
          onChange={(v) => store.updateSettings({ budgetAlert: v })}
        />
      </Section>

      {/* 数据 */}
      <Section title="数据管理">
        <Row
          icon={<FileText size={18} color="var(--color-primary)" />}
          label="导出报表（Markdown）"
          onClick={() => {
            downloadMarkdownReport(store, {
              startDate: monthStart,
              endDate: today,
              targetCurrency: store.settings.currency,
            })
            toast.show('报表已导出')
          }}
        />
        <Row
          icon={<Download size={18} color="var(--color-primary)" />}
          label="导出备份（JSON）"
          onClick={() => {
            downloadBackup(store)
            toast.show('备份已导出')
          }}
        />
        <Row
          icon={<Upload size={18} color="var(--color-primary)" />}
          label="导入备份"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <Row
          icon={<Trash2 size={18} color="#FF6B6B" />}
          label="清空所有记录"
          danger
          onClick={handleClear}
        />
      </Section>

      <div
        style={{
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: 12,
          padding: '16px 0 4px',
        }}
      >
        轻记 · 极简记账 v1.0.0
      </div>

      <Sheet open={picker === 'currency'} onClose={() => setPicker(null)} title="选择货币">
        <CurrencyPicker
          value={store.settings.currency}
          onChange={(code) => {
            store.updateSettings({ currency: code })
            setPicker(null)
            toast.show('主货币已更新')
          }}
        />
      </Sheet>
    </Sheet>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-tertiary)',
          fontWeight: 600,
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  )
}

function Row({ icon, label, desc, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 14px',
        borderRadius: 14,
        background: 'rgba(0,0,0,0.02)',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {icon && (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: 'rgba(78,205,196,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: danger ? '#FF6B6B' : 'var(--text)',
          }}
        >
          {label}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {desc}
          </div>
        )}
      </div>
      <ChevronRight size={18} color="var(--text-tertiary)" />
    </button>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 14px',
        borderRadius: 14,
        background: 'rgba(0,0,0,0.02)',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          border: 'none',
          background: checked ? 'var(--color-primary)' : 'rgba(0,0,0,0.15)',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 23 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}
