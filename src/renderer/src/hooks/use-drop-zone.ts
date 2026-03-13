import { useCallback, useState } from 'react'
import { inputStore } from '@/store/input-store'
import { dataURLtoFile } from '@/utils/data-url'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
export const HISTORY_IMAGE_TYPE = 'application/vizo-history-image'

async function getImageFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = []

  // ��ʷ��¼�����ͼƬ��֧�� dataUrl �� path��
  const historyData = dataTransfer.getData(HISTORY_IMAGE_TYPE)
  if (historyData) {
    try {
      const parsed = JSON.parse(historyData) as { dataUrl?: string; path?: string }
      if (parsed.dataUrl?.startsWith('data:image/')) {
        files.push(dataURLtoFile(parsed.dataUrl, `history-${Date.now()}.png`))
      } else if (parsed.path && typeof window?.electronAPI?.readCacheFile === 'function') {
        const data = await window.electronAPI.readCacheFile(parsed.path)
        if (data) {
          const dataUrl = `data:${data.mimeType};base64,${data.base64}`
          const ext = data.mimeType.includes('png') ? 'png' : data.mimeType.includes('webp') ? 'webp' : 'jpg'
          files.push(dataURLtoFile(dataUrl, `history-${Date.now()}.${ext}`))
        }
      }
    } catch {
      // ignore
    }
    return files
  }

  if (dataTransfer.files) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const f = dataTransfer.files[i]
      if (ALLOWED_TYPES.includes(f.type)) files.push(f)
    }
  }
  return files
}

export function useDropZone(onDrop?: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const hasImage = Array.from(e.dataTransfer.types).some(
      (t) => t === 'Files' || t === HISTORY_IMAGE_TYPE
    )
    setIsDragging(!!hasImage)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = await getImageFiles(e.dataTransfer)
      if (files.length === 0) return

      await inputStore.addImages(files)
      onDrop?.(files)
    },
    [onDrop]
  )

  return { isDragging, handleDragOver, handleDragLeave, handleDrop }
}
