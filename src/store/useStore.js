import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ALL_CATEGORIES,
  ACCOUNTS,
  DEFAULT_SCHEME,
  DEFAULT_CURRENCY,
  CURRENCY_MAP,
  DEFAULT_BUDGET,
  TX,
  STORAGE_KEY,
} from '../data/constants'
import { uid } from '../utils/id'
import { todayStr, nowTimeStr } from '../utils/format'
import { fetchLiveRates } from '../services/exchangeRate'

const initialSettings = {
  currency: DEFAULT_CURRENCY,
  currencySymbol: CURRENCY_MAP[DEFAULT_CURRENCY].symbol,
  theme: 'light',
  activeSchemeId: DEFAULT_SCHEME.id,
  budgetAlert: true,
  // 记账货币：用户上次选择，保持固定直到主动更换
  recordCurrency: DEFAULT_CURRENCY,
  // 转换目标货币：记账页预览换算的目标币种
  convertCurrency: DEFAULT_CURRENCY,
}

const initialBudgets = [
  { id: 'b_monthly', period: 'monthly', amount: DEFAULT_BUDGET },
]

export const useStore = create(
  persist(
    (set, get) => ({
      // ===== 数据 =====
      records: [],
      categories: ALL_CATEGORIES,
      accounts: ACCOUNTS,
      budgets: initialBudgets,
      schemes: [DEFAULT_SCHEME],
      photos: [],
      settings: initialSettings,

      // 实时汇率缓存（不持久化，每次进入 App 按需拉取）
      liveRates: null, // { rates, updatedAt, nextUpdate }
      liveRatesLoading: false,
      liveRatesError: null,

      // 撤销删除缓存
      _undoRecord: null,

      // ===== 记录 =====
      addRecord: (partial) => {
        const now = Date.now()
        const record = {
          id: uid('r'),
          type: TX.EXPENSE,
          amount: 0,
          currency: get().settings.currency,
          categoryId: null,
          accountId: null,
          toAccountId: null,
          date: todayStr(),
          time: nowTimeStr(),
          note: '',
          photos: [],
          createdAt: now,
          updatedAt: now,
          ...partial,
        }
        set((s) => ({ records: [record, ...s.records] }))
        return record
      },

      updateRecord: (id, patch) =>
        set((s) => ({
          records: s.records.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: Date.now() } : r
          ),
        })),

      deleteRecord: (id) => {
        const record = get().records.find((r) => r.id === id)
        if (!record) return
        set((s) => ({
          records: s.records.filter((r) => r.id !== id),
          _undoRecord: record,
        }))
      },

      undoDelete: () => {
        const rec = get()._undoRecord
        if (!rec) return false
        set((s) => ({ records: [rec, ...s.records], _undoRecord: null }))
        return true
      },

      clearUndo: () => set({ _undoRecord: null }),

      // ===== 照片 =====
      addPhoto: (recordId, dataUrl) => {
        const photo = { id: uid('p'), recordId, dataUrl, createdAt: Date.now() }
        set((s) => ({ photos: [...s.photos, photo] }))
        return photo
      },

      removePhoto: (photoId) =>
        set((s) => ({ photos: s.photos.filter((p) => p.id !== photoId) })),

      getPhotosForRecord: (recordId) =>
        (get().photos || []).filter((p) => p.recordId === recordId),

      // ===== 分类 =====
      addCategory: (partial) =>
        set((s) => ({
          categories: [
            ...s.categories,
            { id: uid('c'), system: false, ...partial },
          ],
        })),

      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      removeCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => !(c.id === id && !c.system)),
        })),

      // ===== 账户 =====
      addAccount: (partial) =>
        set((s) => ({
          accounts: [
            ...s.accounts,
            { id: uid('a'), system: false, kind: 'debit', ...partial },
          ],
        })),

      updateAccount: (id, patch) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        })),

      removeAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => !(a.id === id && !a.system)),
        })),

      // ===== 预算 =====
      setBudget: (period, amount) =>
        set((s) => {
          const exists = s.budgets.find((b) => b.period === period)
          if (exists) {
            return {
              budgets: s.budgets.map((b) =>
                b.period === period ? { ...b, amount } : b
              ),
            }
          }
          return { budgets: [...s.budgets, { id: uid('b'), period, amount }] }
        }),

      getBudget: (period) =>
        get().budgets.find((b) => b.period === period)?.amount ?? 0,

      // ===== 汇率方案 =====
      addScheme: (partial) => {
        const id = uid('sch')
        set((s) => ({
          schemes: [
            ...s.schemes,
            { id, system: false, ...partial },
          ],
        }))
        return id
      },

      updateScheme: (id, patch) =>
        set((s) => ({
          schemes: s.schemes.map((sc) =>
            sc.id === id ? { ...sc, ...patch } : sc
          ),
        })),

      removeScheme: (id) =>
        set((s) => ({
          schemes: s.schemes.filter((sc) => !(sc.id === id && !sc.system)),
        })),

      setActiveScheme: (id) =>
        set((s) => ({ settings: { ...s.settings, activeSchemeId: id } })),

      /**
       * 拉取实时汇率并缓存到 liveRates。
       * 不修改任何方案——方案 rates 的更新由 refreshActiveSchemeRates 完成。
       */
      fetchLiveRates: async (force = false) => {
        set({ liveRatesLoading: true, liveRatesError: null })
        try {
          const result = await fetchLiveRates(force)
          set({ liveRates: result, liveRatesLoading: false })
          return result
        } catch (e) {
          set({ liveRatesLoading: false, liveRatesError: e.message || '获取失败' })
          throw e
        }
      },

      /**
       * 用实时汇率刷新当前激活方案的 rates。
       * 原理与手动编辑保存完全一致：写入 scheme.rates 后，
       * 所有记账 / 明细 / 统计的换算立刻按新值计算。
       */
      refreshActiveSchemeRates: async () => {
        const { liveRates } = get()
        let rates = liveRates?.rates
        if (!rates) {
          const fresh = await get().fetchLiveRates(true)
          rates = fresh.rates
        }
        const activeId = get().settings.activeSchemeId
        get().updateScheme(activeId, {
          rates,
          liveUpdatedAt: new Date().toISOString(),
        })
        return rates
      },

      // ===== 设置 =====
      updateSettings: (patch) =>
        set((s) => {
          const next = { ...s.settings, ...patch }
          if (patch.currency) {
            next.currencySymbol = CURRENCY_MAP[patch.currency]?.symbol || '¥'
          }
          return { settings: next }
        }),

      resetSettings: () => set({ settings: initialSettings }),

      // ===== 导入 / 清空 =====
      importData: (data) =>
        set((s) => ({
          records: data.records ?? s.records,
          categories: data.categories ?? s.categories,
          accounts: data.accounts ?? s.accounts,
          budgets: data.budgets ?? s.budgets,
          schemes: data.schemes ?? s.schemes,
          photos: data.photos ?? s.photos,
          settings: { ...initialSettings, ...(data.settings || {}) },
        })),

      clearAll: () =>
        set({
          records: [],
          photos: [],
          _undoRecord: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({
        records: s.records,
        categories: s.categories,
        accounts: s.accounts,
        budgets: s.budgets,
        schemes: s.schemes,
        photos: s.photos,
        settings: s.settings,
      }),
    }
  )
)
