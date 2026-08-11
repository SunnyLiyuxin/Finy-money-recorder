import BottomNav from './BottomNav'
import { useRoute } from '../router'
import ErrorBoundary from './ErrorBoundary'

export default function Layout({ children }) {
  const route = useRoute()
  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        minHeight: '100dvh',
        background: 'var(--bg)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, paddingBottom: 96 }}>
        <ErrorBoundary key={route}>
          {children}
        </ErrorBoundary>
      </div>
      <BottomNav />
    </div>
  )
}
