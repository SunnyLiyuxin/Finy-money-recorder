import { useState, useCallback } from 'react'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import { useRoute } from './router'
import Record from './views/Record'
import Records from './views/Records'
import Stats from './views/Stats'
import Accounts from './views/Accounts'
import Budget from './views/Budget'

export default function App() {
  const route = useRoute()
  // 闪屏仅在每次 APP 启动时展示一次；完成后进入主界面，且不可返回闪屏。
  // 使用内存 state（不持久化），每次刷新/重新打开 APP 都会再次展示闪屏。
  const [booted, setBooted] = useState(false)

  const handleSplashDone = useCallback(() => setBooted(true), [])

  if (!booted) {
    return <SplashScreen onComplete={handleSplashDone} />
  }

  return (
    <ToastProvider>
      <Layout>
        {route === '/records' ? (
          <Records />
        ) : route === '/stats' ? (
          <Stats />
        ) : route === '/accounts' ? (
          <Accounts />
        ) : route === '/budget' ? (
          <Budget />
        ) : (
          <Record />
        )}
      </Layout>
    </ToastProvider>
  )
}
