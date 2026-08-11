import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useEffect } from 'react'

/**
 * 全屏照片查看器
 *
 * @param {Object} props
 * @param {Array<{id, dataUrl}>} props.photos 照片列表
 * @param {number} props.index 当前查看的索引
 * @param {Function} props.onClose 关闭
 * @param {Function} props.onDelete 可选，删除回调（传入 photoId）
 */
export default function PhotoViewer({ photos, index, onClose, onDelete }) {
  const current = photos[index]

  // 切换索引（由父组件控制）
  const goPrev = () => {
    // 通过外部回调实现，这里简化为关闭后由调用方重新打开
  }

  useEffect(() => {
    if (current) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [current])

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 顶部栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>
              {index + 1} / {photos.length}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {onDelete && (
                <button
                  onClick={() => onDelete(current.id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  border: 'none',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 图片区 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              padding: '0 8px',
            }}
          >
            <motion.img
              key={current.id}
              src={current.dataUrl}
              alt=""
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />
          </div>

          {/* 底部缩略图条 */}
          {photos.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '12px',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
                overflowX: 'auto',
                justifyContent: 'center',
              }}
            >
              {photos.map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    width: i === index ? 56 : 40,
                    height: i === index ? 56 : 40,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: i === index ? '2px solid #4ECDC4' : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <img
                    src={p.dataUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
