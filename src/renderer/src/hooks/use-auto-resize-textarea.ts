import { useCallback, useRef } from 'react'

const MAX_HEIGHT = '50vh'

/**
 * 多行输入框自动增高
 * 内容增多时增高，超过 maxHeight 后内部滚动
 */
export function useAutoResizeTextarea() {
  const ref = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    const maxPx = typeof window !== 'undefined' ? window.innerHeight * 0.5 : 400
    const scrollHeight = el.scrollHeight
    if (scrollHeight > maxPx) {
      el.style.height = `${maxPx}px`
      el.style.overflowY = 'auto'
    } else {
      el.style.height = `${scrollHeight}px`
      el.style.overflowY = 'hidden'
    }
  }, [])

  return { ref, adjustHeight }
}
