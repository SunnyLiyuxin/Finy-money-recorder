import { motion } from 'framer-motion'
import { TABS } from '../data/constants'
import { TabIcon } from '../data/icons'
import { useNavigate, useRoute } from '../router'

export default function BottomNav() {
  const route = useRoute()
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          padding: '6px 4px 4px',
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        {TABS.map((tab) => {
          const active = route === tab.path
          const isCenter = tab.key === 'record'

          if (isCenter) {
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  flex: 1,
                  position: 'relative',
                  top: -14,
                }}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #7EDDD7 0%, #4ECDC4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow:
                      '0 6px 18px rgba(78,205,196,0.45), 0 0 0 4px rgba(255,255,255,0.9)',
                  }}
                >
                  <TabIcon icon={tab.icon} size={26} strokeWidth={2.4} />
                </motion.div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: active
                      ? 'var(--color-primary-dark)'
                      : 'var(--text-tertiary)',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                flex: 1,
                padding: '6px 0',
                color: active ? 'var(--color-primary-dark)' : 'var(--text-tertiary)',
              }}
            >
              <TabIcon
                icon={tab.icon}
                size={22}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
