// 数据模型类型定义 (JSDoc)
// 金额以「分」为单位整数存储，避免浮点误差；展示时 / 100。

/**
 * @typedef {'expense'|'income'|'transfer'} TxType
 * 交易类型：支出 / 收入 / 转账
 */

/**
 * @typedef {Object} Record
 * @property {string} id
 * @property {TxType} type
 * @property {number} amount        金额（分）
 * @property {string} currency      原始货币代码 e.g. 'CNY'
 * @property {number} [convertedAmount] 换算后的金额（分），基于汇率方案
 * @property {string|null} categoryId
 * @property {string|null} accountId
 * @property {string|null} [toAccountId]  转账目标账户
 * @property {string} date         ISO date 'YYYY-MM-DD'
 * @property {string} [time]       'HH:mm'
 * @property {string} [note]
 * @property {string[]} photos     dataURL 列表
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} icon     对应 icons 映射的 key
 * @property {string} color
 * @property {TxType} type
 * @property {boolean} [system] 系统内置不可删除
 */

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {string} color
 * @property {'debit'|'credit'} kind  储蓄 / 信用
 * @property {number} [creditLimit]  信用额度（分）
 * @property {number} [billingDay]   账单日
 * @property {number} [dueDay]       还款日
 * @property {boolean} [system]
 */

/**
 * @typedef {Object} Currency
 * @property {string} code   CNY/USD/EUR/HKD/JPY/GBP
 * @property {string} name
 * @property {string} symbol
 * @property {number} rate   相对 CNY 的汇率（1 该币 = rate CNY）
 */

/**
 * @typedef {Object} CurrencyScheme 汇率方案
 * @property {string} id
 * @property {string} name
 * @property {Record<string, number>} rates  { CNY:1, USD:7.2, ... }
 * @property {boolean} [system]
 */

/**
 * @typedef {'daily'|'weekly'|'monthly'} BudgetPeriod
 */

/**
 * @typedef {Object} Budget
 * @property {string} id
 * @property {BudgetPeriod} period
 * @property {number} amount   预算金额（分）
 * @property {string} [categoryId]  可选：分类预算
 */

/**
 * @typedef {Object} Settings
 * @property {string} currency         主显示货币
 * @property {string} currencySymbol
 * @property {string} activeSchemeId   当前汇率方案
 * @property {boolean} budgetAlert
 * @property {string} theme
 */
