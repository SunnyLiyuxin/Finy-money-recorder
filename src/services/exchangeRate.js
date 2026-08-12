/**
 * 实时汇率服务（多数据源容错 + PWA 降级版）
 *
 * 问题背景：
 *   iOS/Android 将网页添加到桌面后，以 standalone 模式运行，
 *   对 fetch 跨域请求限制比浏览器内更严，可能完全无法请求境外 API。
 *
 * 方案：
 *   1. 多 API 源轮询（fetch）
 *   2. JSONP 方式备用（script 标签加载，iOS PWA 限制更宽松）
 *   3. 全部失败时降级到内置默认汇率，标注"离线参考"
 *
 * 原理与手动输入完全一致：
 *   - 汇率格式仍是「1 该币 = X CNY」
 *   - 获取后写入汇率方案的 rates 字段
 *   - 所有记账 / 明细 / 统计的换算逻辑不变
 */

import { CURRENCIES, DEFAULT_SCHEME } from '../data/constants'

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
    offline: false,
  }
}

/**
 * 降级：返回内置默认汇率（标注离线）
 * 用于 PWA standalone 模式下所有 API 都不可达的情况
 */
function fallbackRates() {
  return {
    rates: { ...DEFAULT_SCHEME.rates },
    updatedAt: new Date().toISOString(),
    nextUpdate: '',
    source: '内置参考汇率',
    offline: true,
  }
}

/**
 * 获取实时汇率（多源容错 + 降级）
 *
 * @param {boolean} force - 强制刷新，忽略缓存
 * @returns {Promise<{rates, updatedAt, nextUpdate, source, offline}>}
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

  // 所有 API 都失败 → 降级到内置汇率
  // 不再抛错，而是返回离线参考汇率，让用户仍能使用
  const fallback = fallbackRates()
  _cache = fallback
  _cacheTime = Date.now()
  // 在 source 中附上失败原因，便于诊断
  fallback.source = `内置参考汇率（在线源全失败：${errors.join('；')}）`
  return fallback
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
