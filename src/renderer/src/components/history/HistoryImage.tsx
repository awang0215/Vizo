import { useState } from 'react'
import { HISTORY_IMAGE_TYPE } from '@/hooks/use-drop-zone'
import { cn } from '@/lib/utils'

interface HistoryImageProps {
  url: string
  index: number
  images: { url: string }[]
  onPreview: () => void
  path?: string
  size?: 'sm' | 'lg'
}

export function HistoryImage({ url, onPreview, path, size = 'sm' }: HistoryImageProps) {
  const [loadFailed, setLoadFailed] = useState(false)

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onPreview()
  }

  const handleDragStart = (event: React.DragEvent) => {
    const payload = path ? { path } : { dataUrl: url }
    event.dataTransfer.setData(HISTORY_IMAGE_TYPE, JSON.stringify(payload))
    event.dataTransfer.effectAllowed = 'copy'
  }

  const isLarge = size === 'lg'

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={cn(
        'shrink-0 cursor-pointer overflow-hidden rounded-xl border border-border/75 bg-background/84 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-150',
        'hover:border-primary/30 hover:shadow-[0_8px_18px_rgba(59,130,246,0.08)]',
        isLarge ? 'aspect-[16/9] w-40 shrink-0' : 'h-20 w-20'
      )}
    >
      <img
        src={loadFailed ? '' : url}
        alt=""
        className={cn('h-full w-full', isLarge ? 'object-contain' : 'object-cover')}
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={() => setLoadFailed(true)}
      />
      {loadFailed && (
        <div className="flex h-full w-full items-center justify-center bg-muted/30 px-2 text-center text-[11px] font-medium text-muted-foreground">
          图片不可用
        </div>
      )}
    </div>
  )
}
