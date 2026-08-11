// 统计计算：按周期汇总、分类占比、账户余额
import { TX } from '../data/constants'
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  toDateStr,
} from './format'
import { convertRecordAmount } from './currency'

/** 当前生效的汇率方案 */
export function activeScheme(state) {
  return (
    state.schemes.find((s) => s.id === state.settings.activeSchemeId) ||
    state.schemes[0]
  )
}

/** 过滤某时间段内的记录（含端点） */
export function recordsInRange(records, startDate, endDate) {
  return records.filter((r) => r.date >= startDate && r.date <= endDate)
}

/** 汇总某类型金额（已换算到目标币种，分） */
export function sumByType(records, type, targetCurrency, scheme) {
  return records
    .filter((r) => r.type === type)
    .reduce((acc, r) => acc + convertRecordAmount(r, targetCurrency, scheme), 0)
}

/** 今日支出 */
export function todayExpense(state) {
  const scheme = activeScheme(state)
  const cur = state.settings.currency
  const start = toDateStr(startOfDay(new Date()))
  const list = recordsInRange(state.records, start, start)
  return sumByType(list, TX.EXPENSE, cur, scheme)
}

/** 本周支出 */
export function weekExpense(state) {
  const scheme = activeScheme(state)
  const cur = state.settings.currency
  const start = toDateStr(startOfWeek(new Date()))
  const end = toDateStr(new Date())
  const list = recordsInRange(state.records, start, end)
  return sumByType(list, TX.EXPENSE, cur, scheme)
}

/** 本月支出 */
export function monthExpense(state) {
  const scheme = activeScheme(state)
  const cur = state.settings.currency
  const start = toDateStr(startOfMonth(new Date()))
  const end = toDateStr(new Date())
  const list = recordsInRange(state.records, start, end)
  return sumByType(list, TX.EXPENSE, cur, scheme)
}

/** 本周每日支出数组（周一~今天），用于日历条 */
export function weekDailyExpenses(state) {
  const scheme = activeScheme(state)
  const cur = state.settings.currency
  const start = startOfWeek(new Date())
  const today = startOfDay(new Date())
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    if (d > today) {
      days.push({ date: toDateStr(d), amount: 0, future: true })
      continue
    }
    const ds = toDateStr(d)
    const list = state.records.filter((r) => r.date === ds)
    days.push({
      date: ds,
      amount: sumByType(list, TX.EXPENSE, cur, scheme),
      future: false,
    })
  }
  return days
}

/** 分类占比：[{category, amount, percent}] */
export function categoryBreakdown(records, type, state) {
  const scheme = activeScheme(state)
  const cur = state.settings.currency
  const list = records.filter((r) => r.type === type)
  const total = sumByType(list, type, cur, scheme)
  const map = {}
  list.forEach((r) => {
    const cid = r.categoryId || 'other'
    map[cid] = (map[cid] || 0) + convertRecordAmount(r, cur, scheme)
  })
  return Object.entries(map)
    .map(([cid, amount]) => {
      const category = state.categories.find((c) => c.id === cid)
      return {
        categoryId: cid,
        category,
        amount,
        percent: total ? (amount / total) * 100 : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

/** 账户余额（分）：收入+，支出-，转账转出-转入+ */
export function accountBalance(state, accountId, targetCurrency) {
  const scheme = activeScheme(state)
  const cur = targetCurrency || state.settings.currency
  let bal = 0
  state.records.forEach((r) => {
    if (r.accountId === accountId && r.type === TX.INCOME) {
      bal += convertRecordAmount(r, cur, scheme)
    } else if (r.accountId === accountId && r.type === TX.EXPENSE) {
      bal -= convertRecordAmount(r, cur, scheme)
    } else if (r.type === TX.TRANSFER) {
      if (r.accountId === accountId) bal -= convertRecordAmount(r, cur, scheme)
      if (r.toAccountId === accountId) bal += convertRecordAmount(r, cur, scheme)
    }
  })
  return bal
}

/** 全部账户净资产 */
export function totalAssets(state) {
  return state.accounts.reduce(
    (acc, a) => acc + accountBalance(state, a.id),
    0
  )
}
