// 常量：货币、分类、账户、颜色

export const STORAGE_KEY = 'smart-bookkeeping-storage'

/** 交易类型 */
export const TX = Object.freeze({
  EXPENSE: 'expense',
  INCOME: 'income',
  TRANSFER: 'transfer',
})

export const TX_LABEL = {
  expense: '支出',
  income: '收入',
  transfer: '转账',
}

/** 主题色 */
export const COLORS = {
  primary: '#4ECDC4',
  primaryLight: '#7EDDD7',
  primaryDark: '#3DBFB5',
  expense: '#FF6B6B',
  income: '#4CAF50',
  transfer: '#607D8B',
}

/**
 * 货币列表。rate 为相对 CNY 的参考汇率（1 该币 ≈ rate CNY）。
 */
export const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥', rate: 1 },
  { code: 'USD', name: '美元', symbol: '$', rate: 7.2 },
  { code: 'EUR', name: '欧元', symbol: '€', rate: 7.8 },
  { code: 'HKD', name: '港币', symbol: 'HK$', rate: 0.92 },
  { code: 'JPY', name: '日元', symbol: '¥', rate: 0.046 },
  { code: 'GBP', name: '英镑', symbol: '£', rate: 9.2 },
]

export const CURRENCY_MAP = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c])
)

export const DEFAULT_CURRENCY = 'CNY'

/** 默认汇率方案 */
export const DEFAULT_SCHEME = {
  id: 'default',
  name: '默认汇率',
  system: true,
  rates: Object.fromEntries(CURRENCIES.map((c) => [c.code, c.rate])),
}

/** 支出分类 */
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '餐饮', icon: 'food', color: '#FF6B6B', type: TX.EXPENSE, system: true },
  { id: 'coffee', name: '咖啡', icon: 'coffee', color: '#A0826D', type: TX.EXPENSE, system: true },
  { id: 'transport', name: '交通', icon: 'transport', color: '#4ECDC4', type: TX.EXPENSE, system: true },
  { id: 'shopping', name: '购物', icon: 'shopping', color: '#FF9F43', type: TX.EXPENSE, system: true },
  { id: 'grocery', name: '超市', icon: 'grocery', color: '#54A0FF', type: TX.EXPENSE, system: true },
  { id: 'housing', name: '住房', icon: 'housing', color: '#5F27CD', type: TX.EXPENSE, system: true },
  { id: 'entertainment', name: '娱乐', icon: 'entertainment', color: '#EE5A6F', type: TX.EXPENSE, system: true },
  { id: 'medical', name: '医疗', icon: 'medical', color: '#FF6B9D', type: TX.EXPENSE, system: true },
  { id: 'education', name: '学习', icon: 'education', color: '#00B894', type: TX.EXPENSE, system: true },
  { id: 'social', name: '社交', icon: 'social', color: '#F368E0', type: TX.EXPENSE, system: true },
  { id: 'bills', name: '账单', icon: 'bills', color: '#607D8B', type: TX.EXPENSE, system: true },
  { id: 'pets', name: '宠物', icon: 'pets', color: '#FFA502', type: TX.EXPENSE, system: true },
  { id: 'other', name: '其他', icon: 'other', color: '#9CA3AF', type: TX.EXPENSE, system: true },
]

/** 收入分类 */
export const INCOME_CATEGORIES = [
  { id: 'salary', name: '工资', icon: 'salary', color: '#4CAF50', type: TX.INCOME, system: true },
  { id: 'bonus', name: '奖金', icon: 'bonus', color: '#2ED573', type: TX.INCOME, system: true },
  { id: 'parttime', name: '兼职', icon: 'parttime', color: '#7BED9F', type: TX.INCOME, system: true },
  { id: 'investment', name: '投资', icon: 'investment', color: '#26DE81', type: TX.INCOME, system: true },
  { id: 'refund', name: '退款', icon: 'refund', color: '#2BCBBA', type: TX.INCOME, system: true },
  { id: 'redpacket', name: '红包', icon: 'redpacket', color: '#FF6B81', type: TX.INCOME, system: true },
  { id: 'other_income', name: '其他收入', icon: 'other_income', color: '#9CA3AF', type: TX.INCOME, system: true },
]

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]

/** 账户 */
export const ACCOUNTS = [
  { id: 'wechat', name: '微信', icon: 'wechat', color: '#07C160', kind: 'debit', system: true },
  { id: 'alipay', name: '支付宝', icon: 'alipay', color: '#1677FF', kind: 'debit', system: true },
  { id: 'cash', name: '现金', icon: 'cash', color: '#607D8B', kind: 'debit', system: true },
  { id: 'debit', name: '储蓄卡', icon: 'debit', color: '#4ECDC4', kind: 'debit', system: true },
  { id: 'credit', name: '信用卡', icon: 'credit', color: '#FF6B6B', kind: 'credit', creditLimit: 0, system: true },
  { id: 'other_account', name: '其他账户', icon: 'other_account', color: '#9CA3AF', kind: 'debit', system: true },
]

/** 预算周期 */
export const BUDGET_PERIODS = [
  { value: 'daily', name: '每日预算' },
  { value: 'weekly', name: '每周预算' },
  { value: 'monthly', name: '每月预算' },
]

export const DEFAULT_BUDGET = 600000 // 6000 元（分）

/** 路由 */
export const ROUTES = {
  RECORD: '/',
  RECORDS: '/records',
  STATS: '/stats',
  ACCOUNTS: '/accounts',
  BUDGET: '/budget',
}

export const TABS = [
  { key: 'record', label: '记账', path: ROUTES.RECORD, icon: 'tab-record' },
  { key: 'records', label: '明细', path: ROUTES.RECORDS, icon: 'tab-records' },
  { key: 'stats', label: '统计', path: ROUTES.STATS, icon: 'tab-stats' },
  { key: 'accounts', label: '账户', path: ROUTES.ACCOUNTS, icon: 'tab-accounts' },
  { key: 'budget', label: '预算', path: ROUTES.BUDGET, icon: 'tab-budget' },
]
