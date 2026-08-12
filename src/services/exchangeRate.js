/**
 * 实时汇率服务（多数据源容错版）
 *
 * 手机网络环境下，单一境外 API 可能被运营商 DNS 污染或屏蔽，
 * 因此采用多数据源轮询：主源失败自动切换备用源，提高可用性。
 *
 * 数据源：
 *   1. open.er-api.com（主）— 免费、无需 API Key、CORS 友好
 *   2. api.exchangerate-api.com（备）— 同公司备用域名
 *   3.cdn.jsdelivr.net 的静态汇率 JSON（兜底）— CDN 加速，国内可达性好
 *
 * 原理与手动输入完全一致：
 *   - 汇率格式仍是「1 该币 = X CNY」
 *   - 获取后写入汇率方案的 rates 字段
 *   - 所有记账 / 明细 / 统计的换算逻辑不变
 */

import { CURRENCIES } from '../data/constants'

// 多数据源：按优先级尝试，任一成功即返回
const SOURCES = [
  {
    name: 'er-api',
    url: 'https://open.er-api.com/v6/latest/CNY',
    parse: (data) => {
      if (data.result !== 'success' || !data.rates) return null
      return {
        rawRates: data.rates,
        updatedAt: data.time_last_update_utc || new Date().toISOString(),
      }
    },
  },
  {
    name: 'exchangerate-api',
    url: 'https://v6.exchangerate-api.com/v6/latest/CNY',
    parse: (data) => {
      if (data.result !== 'success' || !data.conversion_rates) return null
      return {
        rawRates: data.conversion_rates,
        updatedAt: data.time_last_update_utc || new Date().toISOString(),
      }
    },
  },
  {
    name: 'frankfurter',
    url: 'https://api.frankfurter.app/latest?from=CNY',
    parse: (data) => {
      if (!data.rates) return null
      // frankfurter 不含 CNY 自身，补上
      return {
        rawRates: { ...data.rates, CNY: 1 },
        updatedAt: data.date || new Date().toISOString(),
      }
    },
  },
]

// 简单内存缓存，避免短时间重复请求
let _cache = null
let _cacheTime = 0
const CACHE_TTL = 10 * 60 * 1000 // 10 分钟

/**
 * 带超时的 fetch
 */
function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

/**
 * 将「1 CNY = X 该币」转为「1 该币 = X CNY」，并只保留支持的币种
 */
function normalizeRates(rawRates, updatedAt, sourceName) {
  const rates = {}
  for (const [code, val] of Object.entries(rawRates)) {
    if (val > 0) {
      rates[code] = +(1 / val).toFixed(4)
    }
  }
  rates.CNY = 1

  const supportedRates = {}
  CURRENCIES.forEach((c) => {
    if (rates[c.code] !== undefined) {
      supportedRates[c.code] = rates[c.code]
    }
  })

  return {
    rates: supportedRates,
    updatedAt,
    nextUpdate: '',
    source: sourceName,
  }
}

/**
 * 获取实时汇率（多源容错）
 *
 * @param {boolean} force - 强制刷新，忽略缓存
 * @returns {Promise<{rates, updatedAt, nextUpdate, source}>}
 */
export async function fetchLiveRates(force = false) {
  // 命中缓存
  if (!force && _cache && Date.now() - _cacheTime < CACHE_TTL) {
    return _cache
  }

  const errors = []

  // 依次尝试每个数据源
  for (const src of SOURCES) {
    try {
      const res = await fetchWithTimeout(src.url, 8000)
      if (!res.ok) {
        errors.push(`${src.name}: HTTP ${res.status}`)
        continue
      }
      const data = await res.json()
      const parsed = src.parse(data)
      if (!parsed) {
        errors.push(`${src.name}: 数据格式异常`)
        continue
      }
      const result = normalizeRates(parsed.rawRates, parsed.updatedAt, src.name)
      _cache = result
      _cacheTime = Date.now()
      return result
    } catch (e) {
      const reason = e.name === 'AbortError' ? '超时' : (e.message || '未知错误')
      errors.push(`${src.name}: ${reason}`)
      // 继续尝试下一个数据源
    }
  }

  // 所有数据源都失败
  throw new Error(`所有汇率源均失败 [${errors.join(' | ')}]`)
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
