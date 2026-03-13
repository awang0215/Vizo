import { HistoryImage } from './HistoryImage'
import { OutputImageCard } from './OutputImageCard'
import { inputStore } from '@/store/input-store'
import type { GeneratingRecord } from '@/store/generating-store'

interface HistoryItemGeneratingProps {
  record: GeneratingRecord
}

function formatTime(iso: string): string {
  try {
    const date = new Date(iso)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return ''
  }
}

export function HistoryItemGenerating({ record }: HistoryItemGeneratingProps) {
  const inputImageList = record.inputImages.map((img) => ({
    url: img.displayUrl ?? `data:${img.mimeType};base64,`
  }))

  const previewableOutputImages = record.outputSlots
    .filter((slot) => slot.status !== 'loading')
    .map((slot) => ({ url: slot.displayUrl }))

  const previewIndexBySlot = new Map<number, number>()
  let previewIndex = 0
  record.outputSlots.forEach((slot, index) => {
    if (slot.status === 'loading') return
    previewIndexBySlot.set(index, previewIndex)
    previewIndex += 1
  })

  const handleInputPreview = (index: number) => {
    inputStore.openPreview(inputImageList, index, 'history')
  }

  const handleOutputPreview = (index: number) => {
    inputStore.openPreview(previewableOutputImages, index, 'history')
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-primary/35 bg-primary/6 p-4 shadow-[0_8px_24px_rgba(59,130,246,0.08)]">
      <p className="text-xs font-medium text-muted-foreground">{formatTime(record.createdAt)}</p>

      <div className="flex flex-wrap gap-2">
        {record.inputImages.map((img, index) => (
          <HistoryImage
            key={index}
            url={img.displayUrl ?? `data:${img.mimeType};base64,`}
            index={index}
            images={inputImageList}
            onPreview={() => handleInputPreview(index)}
          />
        ))}
      </div>

      <p className="text-sm leading-6 text-foreground">{record.promptText}</p>

      <div className="flex flex-wrap gap-3">
        {record.outputSlots.map((slot, index) => {
          const currentPreviewIndex = previewIndexBySlot.get(index)

          return (
            <OutputImageCard
              key={`${record.id}-${index}`}
              url={slot.displayUrl}
              mimeType={slot.mimeType}
              onPreview={
                currentPreviewIndex === undefined
                  ? undefined
                  : () => handleOutputPreview(currentPreviewIndex)
              }
              aspectRatio={record.aspectRatio}
              status={slot.status === 'success' ? 'ready' : slot.status}
              error={slot.error}
            />
          )
        })}
      </div>
    </div>
  )
}
