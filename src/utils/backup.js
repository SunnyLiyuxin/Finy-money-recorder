// 备份导入 / 导出 / Markdown 报表
import { TX, CURRENCY_MAP } from '../data/constants'
import { fenToYuan } from './format'
import { convertRecordAmount } from './currency'

/** 导出 JSON 备份 */
export function buildBackup(state) {
  return JSON.stringify(
    {
      app: 'qingji',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        records: state.records,
        categories: state.categories,
        accounts: state.accounts,
        budgets: state.budgets,
        schemes: state.schemes,
        settings: state.settings,
      },
    },
    null,
    2
  )
}

/** 解析备份 */
export function parseBackup(text) {
  const obj = JSON.parse(text)
  if (obj && obj.data) return obj.data
  // 兼容直接是 data 结构
  if (obj && obj.records) return obj
  throw new Error('无法识别的备份文件')
}

function download(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadBackup(state) {
  const ts = new Date().toISOString().slice(0, 10)
  download(`qingji-backup-${ts}.json`, buildBackup(state), 'application/json')
}

/** 生成 Markdown 报表 */
export function buildMarkdownReport(state, { startDate, endDate, targetCurrency }) {
  const scheme =
    state.schemes.find((s) => s.id === state.settings.activeSchemeId) ||
    state.schemes[0]
  const cur = targetCurrency || state.settings.currency
  const symbol = CURRENCY_MAP[cur]?.symbol || '¥'

  const inRange = state.records.filter((r) => {
    if (r.type === TX.TRANSFER) return false
    return r.date >= startDate && r.date <= endDate
  })

  const sum = (type) =>
    inRange
      .filter((r) => r.type === type)
      .reduce(
        (acc, r) => acc + convertRecordAmount(r, cur, scheme),
        0
      )

  const totalExpense = sum(TX.EXPENSE)
  const totalIncome = sum(TX.INCOME)
  const net = totalIncome - totalExpense

  const lines = []
  lines.push(`# 记账报表`)
  lines.push('')
  lines.push(`> 时间范围：${startDate} ~ ${endDate}`)
  lines.push(`> 统计货币：${cur}（${symbol}）`)
  lines.push('')

  lines.push('## 概览')
  lines.push('')
  lines.push(`- 总支出：${symbol}${fenToYuan(totalExpense)}`)
  lines.push(`- 总收入：${symbol}${fenToYuan(totalIncome)}`)
  lines.push(`- 结余：${symbol}${fenToYuan(net)}`)
  lines.push('')

  lines.push('## 支出分类')
  lines.push('')
  lines.push('| 分类 | 金额 | 占比 |')
  lines.push('| --- | --- | --- |')
  const expenseByCat = {}
  inRange
    .filter((r) => r.type === TX.EXPENSE)
    .forEach((r) => {
      const c = r.categoryId || 'other'
      expenseByCat[c] =
        (expenseByCat[c] || 0) + convertRecordAmount(r, cur, scheme)
    })
  Object.entries(expenseByCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cid, amt]) => {
      const cat = state.categories.find((c) => c.id === cid)
      const pct = totalExpense ? ((amt / totalExpense) * 100).toFixed(1) : '0.0'
      lines.push(`| ${cat?.name || '其他'} | ${symbol}${fenToYuan(amt)} | ${pct}% |`)
    })
  lines.push('')

  lines.push('## 收入分类')
  lines.push('')
  lines.push('| 分类 | 金额 |')
  lines.push('| --- | --- |')
  const incomeByCat = {}
  inRange
    .filter((r) => r.type === TX.INCOME)
    .forEach((r) => {
      const c = r.categoryId || 'other_income'
      incomeByCat[c] =
        (incomeByCat[c] || 0) + convertRecordAmount(r, cur, scheme)
    })
  Object.entries(incomeByCat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cid, amt]) => {
      const cat = state.categories.find((c) => c.id === cid)
      lines.push(`| ${cat?.name || '其他'} | ${symbol}${fenToYuan(amt)} |`)
    })
  lines.push('')

  lines.push('## 明细')
  lines.push('')
  lines.push('| 日期 | 类型 | 分类 | 金额 | 备注 |')
  lines.push('| --- | --- | --- | --- | --- |')
  inRange
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .forEach((r) => {
      const cat = state.categories.find((c) => c.id === r.categoryId)
      const amt = convertRecordAmount(r, cur, scheme)
      const sign = r.type === TX.INCOME ? '+' : '-'
      lines.push(
        `| ${r.date} | ${r.type === TX.INCOME ? '收入' : '支出'} | ${cat?.name || '-'} | ${sign}${symbol}${fenToYuan(amt)} | ${r.note || ''} |`
      )
    })

  return lines.join('\n')
}

export function downloadMarkdownReport(state, opts) {
  const ts = new Date().toISOString().slice(0, 10)
  download(
    `qingji-report-${ts}.md`,
    buildMarkdownReport(state, opts),
    'text/markdown'
  )
}
