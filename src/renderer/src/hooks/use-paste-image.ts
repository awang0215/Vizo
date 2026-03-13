import { useCallback } from 'react'
import { inputStore } from '@/store/input-store'

/**
 * ճ��ͼƬ����
 * ��������ͼƬʱ�������������������ʱ����Ĭ��ճ��
 */
export function usePasteImage(onPasteImage?: () => void) {
  return useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            void inputStore.addImages([file]).then(() => onPasteImage?.())
          }
          return
        }
      }
    },
    [onPasteImage]
  )
}
