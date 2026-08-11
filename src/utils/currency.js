// 货币换算
import { CURRENCY_MAP, DEFAULT_SCHEME } from '../data/constants'

/**
 * 取汇率方案中某货币相对 CNY 的汇率
 */
export function getRate(scheme, code) {
  const rates = scheme?.rates || DEFAULT_SCHEME.rates
  return rates[code] ?? CURRENCY_MAP[code]?.rate ?? 1
}

/**
 * 将某币种金额（分）换算为目标币种金额（分）
 * amount_fen * (rateFrom / rateTo)
 */
export function convertFen(fen, fromCode, toCode, scheme) {
  const rFrom = getRate(scheme, fromCode)
  const rTo = getRate(scheme, toCode)
  if (!rTo) return fen
  return Math.round((fen * rFrom) / rTo)
}

/**
 * 批量换算记录金额到目标币种，返回换算后金额（分）
 */
export function convertRecordAmount(record, toCode, scheme) {
  if (!record?.currency || record.currency === toCode) return record.amount
  return convertFen(record.amount, record.currency, toCode, scheme)
}
