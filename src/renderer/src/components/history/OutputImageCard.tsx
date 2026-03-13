import { useState } from 'react'
import { toast } from 'sonner'
import { HISTORY_IMAGE_TYPE } from '@/hooks/use-drop-zone'
import { cn } from '@/lib/utils'

interface OutputImageCardProps {
  url: string
  path?: string
  mimeType?: string
  onPreview?: () => void
  aspectRatio?: string
  status?: 'ready' | 'loading' | 'failed'
  error?: string
}

function parseAspectRatio(aspectRatio?: string): [number, number] {
  if (!aspectRatio) return [16, 9]

  const [widthText, heightText] = aspectRatio.split(':')
  const width = Number(widthText)
  const height = Number(heightText)

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return [16, 9]
  }

  return [width, height]
}

function getAspectRatioStyle(aspectRatio?: string): string {
  const [width, height] = parseAspectRatio(aspectRatio)
  return `${width} / ${height}`
}

function getCardWidthClass(aspectRatio?: string): string {
  const [width, height] = parseAspectRatio(aspectRatio)
  if (width < height) return 'w-28'
  if (width === height) return 'w-32'
  if (width / height > 2) return 'w-44'
  return 'w-40'
}

function getMimeType(url: string, path?: string, explicitMimeType?: string): string {
  if (explicitMimeType) return explicitMimeType

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

  return `vizo-${Date.now()}.${ext}`
}

export function OutputImageCard({
  url,
  path,
  mimeType,
  onPreview,
  aspectRatio,
  status = 'ready',
  error
}: OutputImageCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })

  const canPreview = typeof onPreview === 'function'
  const canDrag = status === 'ready' && (Boolean(path) || url.startsWith('data:image/'))
  const canOpenMenu = status !== 'loading' && (Boolean(path) || url.startsWith('data:'))

  const handleContextMenu = (event: React.MouseEvent) => {
    if (!canOpenMenu) return

    event.preventDefault()
    event.stopPropagation()
    setMenuPos({ x: event.clientX, y: event.clientY })
    setMenuOpen(true)
  }

  const closeMenu = () => setMenuOpen(false)

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation()
    closeMenu()

    try {
      if (path && typeof window?.electronAPI?.copyImageToClipboard === 'function') {
        const result = await window.electronAPI.copyImageToClipboard(path)
        if (!result.success) {
          toast.error(result.error || '复制失败')
          return
        }

        toast.success('已复制到剪贴板')
        return
      }

      if (!url.startsWith('data:')) return

      const response = await fetch(url)
      const blob = await response.blob()
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleDragStart = (event: React.DragEvent) => {
    if (!canDrag) {
      event.preventDefault()
      return
    }

    const payload = path ? { path } : { dataUrl: url }
    const resolvedMimeType = getMimeType(url, path, mimeType)
    const filename = getFilename(path, resolvedMimeType)

    event.dataTransfer.setData(HISTORY_IMAGE_TYPE, JSON.stringify(payload))
    event.dataTransfer.setData('DownloadURL', `${resolvedMimeType}:${filename}:${url}`)
    event.dataTransfer.setData('text/uri-list', url)
    event.dataTransfer.setData('text/plain', filename)
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div
      className="group relative"
      onContextMenu={handleContextMenu}
      title={error?.trim() || undefined}
    >
      <div
        onClick={canPreview ? onPreview : undefined}
        draggable={canDrag}
        onDragStart={handleDragStart}
        className={cn(
          'overflow-hidden rounded-xl border border-border/75 bg-background/88 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-150',
          getCardWidthClass(aspectRatio),
          canPreview
            ? 'cursor-pointer hover:border-primary/30 hover:shadow-[0_8px_18px_rgba(59,130,246,0.08)]'
            : 'cursor-default',
          canDrag && 'cursor-grab active:cursor-grabbing',
          status === 'loading' && 'border-primary/20 shadow-[0_8px_18px_rgba(59,130,246,0.06)]',
          status === 'failed' && 'border-destructive/20 shadow-[0_8px_18px_rgba(239,68,68,0.07)]'
        )}
      >
        <div style={{ aspectRatio: getAspectRatioStyle(aspectRatio) }}>
          <img
            src={url}
            alt={status === 'failed' ? '生成失败占位图' : status === 'loading' ? '生成中占位图' : ''}
            className="h-full w-full object-cover"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      {status === 'failed' && error && (
        <div className="pointer-events-none absolute right-2 top-2 rounded-full border border-destructive/15 bg-background/92 px-2 py-1 text-[10px] font-medium text-destructive shadow-sm backdrop-blur">
          错误
        </div>
      )}

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeMenu}
            onContextMenu={(event) => event.preventDefault()}
          />
          <div
            className="fixed z-50 min-w-[108px] rounded-xl border border-border/80 bg-background/90 py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)] backdrop-blur"
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
  )
}
