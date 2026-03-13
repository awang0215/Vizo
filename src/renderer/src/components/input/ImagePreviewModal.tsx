import { useEffect, useCallback, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { usePreviewStore } from '@/hooks/use-input-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function getMimeType(url: string, path?: string): string {
  const matched = url.match(/^data:([^;]+);base64,/i)
  if (matched?.[1]) return matched[1]

  const ext = path?.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return 'image/png'
}

function getFilename(path?: string, mimeType?: string): string {
  const fromPath = path?.split(/[\\/]/).pop()
  if (fromPath) return fromPath

  const ext =
    mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'png'

  return `vizo-preview-${Date.now()}.${ext}`
}

export function ImagePreviewModal() {
  const {
    open,
    index,
    images,
    closePreview,
    setPreviewIndex
  } = usePreviewStore()

  const currentImage = images[index]
  const hasMultiple = images.length > 1
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setMenuPos({ x: event.clientX, y: event.clientY })
    setMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const handleCopy = useCallback(async (event: React.MouseEvent) => {
    event.stopPropagation()
    closeMenu()
    if (!currentImage) return
    if (currentImage.path && typeof window?.electronAPI?.copyImageToClipboard === 'function') {
      try {
        const result = await window.electronAPI.copyImageToClipboard(currentImage.path)
        if (result.success) {
          toast.success('已复制到剪贴板')
        } else {
          toast.error(result.error || '复制失败')
        }
      } catch {
        toast.error('复制失败')
      }
      return
    }
    toast.error('当前图片无法复制（图片尚未保存到本地）')
  }, [currentImage, closeMenu])

  const handleDragStart = useCallback((event: React.DragEvent<HTMLImageElement>) => {
    if (!currentImage || !currentImage.url.startsWith('data:image/')) {
      event.preventDefault()
      return
    }

    const mimeType = getMimeType(currentImage.url, currentImage.path)
    const filename = getFilename(currentImage.path, mimeType)

    event.dataTransfer.setData(
      'DownloadURL',
      `${mimeType}:${filename}:${currentImage.url}`
    )
    event.dataTransfer.setData('text/uri-list', currentImage.url)
    event.dataTransfer.setData('text/plain', filename)
    event.dataTransfer.effectAllowed = 'copy'
  }, [currentImage])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return
      if (event.key === 'Escape') {
        closePreview()
        return
      }
      if (event.key === 'ArrowLeft') {
        setPreviewIndex(Math.max(0, index - 1))
      }
      if (event.key === 'ArrowRight') {
        setPreviewIndex(Math.min(images.length - 1, index + 1))
      }
    },
    [open, index, images.length, closePreview, setPreviewIndex]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!open || !currentImage) return null

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && closePreview()}>
      <DialogContent
        className="max-h-[90vh] max-w-[90vw] border-none bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">图片预览</DialogTitle>
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={closePreview}
            className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white backdrop-blur hover:bg-slate-950/82"
            aria-label="关闭"
          >
            x
          </button>

          {hasMultiple && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950/70 text-white backdrop-blur hover:bg-slate-950/82',
                  index === 0 && 'invisible'
                )}
                onClick={() => setPreviewIndex(index - 1)}
                disabled={index === 0}
              >
                {'<'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950/70 text-white backdrop-blur hover:bg-slate-950/82',
                  index === images.length - 1 && 'invisible'
                )}
                onClick={() => setPreviewIndex(index + 1)}
                disabled={index === images.length - 1}
              >
                {'>'}
              </Button>
            </>
          )}

          <img
            src={currentImage.url}
            alt=""
            className={cn(
              'max-h-[90vh] max-w-full object-contain',
              currentImage.url.startsWith('data:image/') && 'cursor-grab active:cursor-grabbing'
            )}
            draggable={currentImage.url.startsWith('data:image/')}
            onDragStart={handleDragStart}
            onContextMenu={handleContextMenu}
          />
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-[60]"
                onClick={closeMenu}
                onContextMenu={(event) => event.preventDefault()}
              />
              <div
                className="fixed z-[70] min-w-[100px] rounded-xl border border-border/80 bg-background/90 py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.16)] backdrop-blur"
                style={{ left: menuPos.x, top: menuPos.y }}
              >
                <button
                  type="button"
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-accent/80 hover:text-accent-foreground"
                  onClick={handleCopy}
                >
                  复制
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
