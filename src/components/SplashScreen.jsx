import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import logo from '../assets/logo.png'

/**
 * 闪屏页 SplashScreen
 *
 * 时序：
 *   0ms        —— 元素从 opacity 0 开始
 *   0 ~ 700    —— 700ms 淡入（ease-out）
 *   700 ~ 2200 —— 保持可见 1500ms
 *   2200 ~2500 —— 300ms 淡出至透明（ease-in）
 *   2500       —— 调用 onComplete，导航到 MainTabs（不可返回）
 *
 * 使用 framer-motion 的 motion.div 控制透明度（等效于 RN 的 Animated API）。
 * 时序由 useEffect + setTimeout 驱动。
 */
export default function SplashScreen({ onComplete }) {
  // 'in' 淡入 → 'hold' 保持 → 'out' 淡出
  const [phase, setPhase] = useState('in')

  useEffect(() => {
    const FADE_IN = 700
    const HOLD = 1500
    const FADE_OUT = 300

    const tHold = setTimeout(() => setPhase('hold'), FADE_IN)
    const tOut = setTimeout(() => setPhase('out'), FADE_IN + HOLD)
    const tDone = setTimeout(() => onComplete?.(), FADE_IN + HOLD + FADE_OUT)

    return () => {
      clearTimeout(tHold)
      clearTimeout(tOut)
      clearTimeout(tDone)
    }
  }, [onComplete])

  const targetOpacity = phase === 'out' ? 0 : 1
  const duration = phase === 'out' ? 0.3 : 0.7
  const ease = phase === 'out' ? 'easeIn' : 'easeOut'

  return (
    // 外层：纯白背景，始终不透明（不参与淡入淡出，保证「纯白背景」从第一帧起）
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // 华文楷体加粗（全局已设，这里显式声明确保覆盖）
        fontFamily: "'STKaiti','KaiTi','华文楷体','楷体',serif",
        fontWeight: 'bold',
      }}
    >
      {/* 内容层：整体淡入 / 保持 / 淡出 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: targetOpacity }}
        transition={{ duration, ease }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* APP 图标：120x120，圆角 24 */}
        <img
          src={logo}
          alt="轻记Finy"
          style={{
            width: 120,
            height: 120,
            borderRadius: 24,
            objectFit: 'cover',
            WebkitTapHighlightColor: 'transparent',
            userSelect: 'none',
            boxShadow: '0 12px 40px rgba(78,205,196,0.18)',
          }}
          draggable={false}
        />

        {/* 应用名称：图标下方 30pt，30pt 字号，#4ECDC4，加粗 */}
        <div className="splash-name" style={{ marginTop: 30 }}>
          轻记Finy
        </div>

        {/* 副标题：名称下方 16pt，13pt 字号，#B0B0B0，两行，行间距 6pt */}
        <div className="splash-sub" style={{ marginTop: 16 }}>
          <div>记账 · 拍照 · 换币</div>
          <div>Finance easy · 花了什么都清晰</div>
        </div>
      </motion.div>
    </div>
  )
}
