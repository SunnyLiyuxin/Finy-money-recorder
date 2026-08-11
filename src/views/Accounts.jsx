import { useMemo } from 'react'
import { Wallet, Plus, CreditCard, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import { EmptyState, ProgressBar } from '../components/ui'
import { AccountIcon } from '../data/icons'
import { TX } from '../data/constants'
import { fenToYuan, withCommas } from '../utils/format'
import { accountBalance, totalAssets, activeScheme } from '../utils/stats'

export default function Accounts() {
  const store = useStore()
  const scheme = activeScheme(store)
  const cur = store.settings.currency
  const symbol = store.settings.currencySymbol

  const debitAccounts = store.accounts.filter((a) => a.kind !== 'credit')
  const creditAccounts = store.accounts.filter((a) => a.kind === 'credit')

  const assets = totalAssets(store)

  const debitTotal = useMemo(
    () => debitAccounts.reduce((acc, a) => acc + Math.max(0, accountBalance(store, a.id)), 0),
    [store, debitAccounts]
  )
  const creditUsed = useMemo(
    () => creditAccounts.reduce((acc, a) => acc + Math.max(0, -accountBalance(store, a.id)), 0),
    [store, creditAccounts]
  )

  return (
    <div style={{ padding: '0 16px' }}>
      <div className="safe-top" style={{ paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>账户</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>全部账户 · 已换算为 {cur}</div>
        </div>
        <button
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'var(--card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow)',
            color: 'var(--color-primary-dark)',
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 净资产卡 */}
      <div
        style={{
          marginTop: 14,
          background: 'linear-gradient(135deg, #4ECDC4 0%, #3DBFB5 100%)',
          borderRadius: 22,
          padding: 20,
          color: '#fff',
          boxShadow: '0 10px 30px rgba(78,205,196,0.3)',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.85 }}>净资产</div>
        <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: -1 }}>
          {symbol}{withCommas(fenToYuan(assets))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>资产</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{symbol}{withCommas(fenToYuan(debitTotal))}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>负债</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{symbol}{withCommas(fenToYuan(creditUsed))}</div>
          </div>
        </div>
      </div>

      {/* 储蓄账户 */}
      <SectionTitle title="储蓄账户" count={debitAccounts.length} />
      {debitAccounts.length === 0 ? (
        <EmptyState icon={<Wallet size={28} />} title="还没有账户" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {debitAccounts.map((a) => {
            const bal = accountBalance(store, a.id)
            return <AccountRow key={a.id} account={a} balance={bal} symbol={symbol} />
          })}
        </div>
      )}

      {/* 信用账户 */}
      {creditAccounts.length > 0 && (
        <>
          <SectionTitle title="信用账户" count={creditAccounts.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {creditAccounts.map((a) => {
              const bal = accountBalance(store, a.id)
              const used = Math.max(0, -bal)
              const limit = a.creditLimit || 0
              const pct = limit ? Math.min(100, (used / limit) * 100) : 0
              return (
                <div
                  key={a.id}
                  style={{
                    background: 'var(--card)',
                    borderRadius: 16,
                    padding: 14,
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: `${a.color}14`,
                        color: a.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AccountIcon icon={a.icon} size={20} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {limit ? `额度 ${symbol}${withCommas(fenToYuan(limit))}` : '未设置额度'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>已用</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-expense)' }}>
                        {symbol}{withCommas(fenToYuan(used))}
                      </div>
                    </div>
                  </div>
                  {limit > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <ProgressBar percent={pct} color={pct >= 90 ? 'var(--color-expense)' : a.color} height={6} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                        <span>可用 {symbol}{withCommas(fenToYuan(Math.max(0, limit - used)))}</span>
                        <span>{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function SectionTitle({ title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10, paddingLeft: 2 }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{count} 个</span>
    </div>
  )
}

function AccountRow({ account, balance, symbol }) {
  const negative = balance < 0
  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 16,
        padding: 14,
        boxShadow: 'var(--shadow)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: `${account.color}14`,
          color: account.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AccountIcon icon={account.icon} size={20} />
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{account.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
          余额
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: negative ? 'var(--color-expense)' : 'var(--text)' }}>
          {negative ? '-' : ''}{symbol}{withCommas(fenToYuan(Math.abs(balance)))}
        </div>
      </div>
      <ChevronRight size={16} color="var(--text-tertiary)" />
    </div>
  )
}
