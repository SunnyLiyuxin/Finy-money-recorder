// 金额 / 日期格式化

/** 分 -> 元字符串，保留两位小数 */
export function fenToYuan(fen) {
  const n = Number(fen) || 0
  return (n / 100).toFixed(2)
}

/** 元字符串 -> 分（整数） */
export function yuanToFen(yuan) {
  const n = parseFloat(yuan)
  if (isNaN(n)) return 0
  return Math.round(n * 100)
}

/** 千分位格式化 */
export function withCommas(numStr) {
  const [intPart, decPart] = String(numStr).split('.')
  const sign = intPart.startsWith('-') ? '-' : ''
  const digits = sign ? intPart.slice(1) : intPart
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return sign + grouped + (decPart !== undefined ? '.' + decPart : '')
}

/** 格式化金额展示：symbol + 千分位 */
export function formatMoney(fen, symbol = '¥', { convert = true } = {}) {
  const yuan = fenToYuan(convert ? fen : fen)
  return `${symbol}${withCommas(yuan)}`
}

/** 紧凑金额：1234 -> 1.2k */
export function formatCompact(fen, symbol = '¥') {
  const n = (Number(fen) || 0) / 100
  const abs = Math.abs(n)
  if (abs >= 10000) return `${symbol}${(n / 10000).toFixed(1)}w`
  if (abs >= 1000) return `${symbol}${(n / 1000).toFixed(1)}k`
  return `${symbol}${n.toFixed(0)}`
}

// ===== 日期 =====

export function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

export function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function nowTimeStr() {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 周一为一周开始 */
export function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** 友好日期：今天/昨天/星期X/MM-DD */
export function friendlyDate(str) {
  const d = parseDate(str)
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const diffDays = Math.round((today - d) / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7 && diffDays > 0) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  }
  return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日`
}

/** 月份展示：2026年8月 */
export function monthLabel(date = new Date()) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

/** 周展示：8.11-8.17 */
export function weekRangeLabel(date = new Date()) {
  const start = startOfWeek(date)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${pad(start.getMonth() + 1)}.${pad(start.getDate())}-${pad(end.getMonth() + 1)}.${pad(end.getDate())}`
}

export function dayLabel(date = new Date()) {
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}
