/**
 * 实时汇率服务
 *
 * 数据源：open.er-api.com（免费、无需 API Key、CORS 友好）
 * 返回数据基于国际真实汇率，每日更新。
 *
 * 原理与手动输入完全一致：
 *   - 汇率格式仍是「1 该币 = X CNY」
 *   - 获取后写入汇率方案的 rates 字段
 *   - 所有记账 / 明细 / 统计的换算逻辑不变
 *
 * 唯一区别：汇率来源从「用户手敲」变为「实时拉取国际真实汇率」。
 */

import { CURRENCIES } from '../data/constants'

const API_BASE = 'https://open.er-api.com/v6/latest/CNY'

// 简单内存缓存，避免短时间重复请求
let _cache = null
let _cacheTime = 0
const CACHE_TTL = 10 * 60 * 1000 // 10 分钟

/**
 * 获取实时汇率
 *
 * @returns {Promise<{rates: Object, updatedAt: string, nextUpdate: string}>}
 *   rates: { USD: 7.2, EUR: 7.8, ... }  —— 1 该币 = X CNY
 */
export async function fetchLiveRates(force = false) {
  // 命中缓存
  if (!force && _cache && Date.now() - _cacheTime < CACHE_TTL) {
    return _cache
  }

  const res = await fetch(API_BASE, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`汇率服务请求失败 (${res.status})`)
  }

  const data = await res.json()

  if (data.result !== 'success' || !data.rates) {
    throw new Error('汇率服务返回异常')
  }

  // API 返回的是「1 CNY = X 该币」，取反转为「1 该币 = X CNY」
  const rates = {}
  for (const [code, val] of Object.entries(data.rates)) {
    if (val > 0) {
      rates[code] = +(1 / val).toFixed(4)
    }
  }
  rates.CNY = 1

  // 只保留 App 支持的币种
  const supportedRates = {}
  CURRENCIES.forEach((c) => {
    if (rates[c.code] !== undefined) {
      supportedRates[c.code] = rates[c.code]
    }
  })

  const result = {
    rates: supportedRates,
    updatedAt: data.time_last_update_utc || new Date().toISOString(),
    nextUpdate: data.time_next_update_utc || '',
  }

  _cache = result
  _cacheTime = Date.now()

  return result
}

/**
 * 格式化更新时间用于展示
 */
export function formatUpdateTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${mm}-${dd} ${hh}:${mi}`
  } catch {
    return ''
  }
}
