import { useState } from 'react'
import { HistoryImage } from './HistoryImage'
import { OutputImageCard } from './OutputImageCard'
import { inputStore } from '@/store/input-store'
import { projectStore } from '@/store/project-store'
import { reuseFromRecord } from '@/services/reuse-service'
import { deleteRecord } from '@/services/history-service'
import { AlertDialog } from '@/components/ui/alert-dialog'
import type { HistoryRecord } from '@/types/history'
import { stripPromptPresets } from '@/utils/prompt-preset'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface HistoryItemProps {
  record: HistoryRecord
}

function getImageUrl(img: { path: string; mimeType: string; displayUrl?: string }): string {
  return img.displayUrl ?? `data:${img.mimeType};base64,`
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
    return '--'
  }
}

function ToolBtn({
  onClick,
  disabled,
  children,
  className
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn('soft-toolbar-btn', className)}
    >
      {children}
    </button>
  )
}

export function HistoryItem({ record }: HistoryItemProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [reusing, setReusing] = useState(false)

  const inputImageList = record.inputImages.map((img) => ({
    url: getImageUrl(img)
  }))

  const outputImageList = record.outputImages.map((img) => ({
    url: getImageUrl(img),
    path: img.path
  }))

  const handleInputPreview = (index: number) => {
    inputStore.openPreview(inputImageList, index, 'history')
  }

  const handleOutputPreview = (index: number) => {
    inputStore.openPreview(outputImageList, index, 'history')
  }

  const handleReuse = async () => {
    setReusing(true)
    try {
      const reusablePromptText =
        record.userPromptText ??
        stripPromptPresets(projectStore.getProject(record.projectId), record.promptText)
      const result = await reuseFromRecord(reusablePromptText, record.inputImages)
      if (result.success) {
        toast.success('已回填到输入区')
      } else if (result.error) {
        toast.error(result.error)
      }
    } finally {
      setReusing(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(record.promptText)
      setCopySuccess(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const handleDelete = async () => {
    const result = await deleteRecord(record.id)
    if (result.success) {
      toast.success('已删除')
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <>
      <div className="section-card flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {formatTime(record.createdAt)}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            <ToolBtn onClick={handleReuse} disabled={reusing}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              {reusing ? '复用中...' : '复用'}
            </ToolBtn>

            <ToolBtn onClick={handleCopy}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              {copySuccess ? '已复制' : '复制'}
            </ToolBtn>

            <ToolBtn
              onClick={() => setDeleteOpen(true)}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" x2="10" y1="11" y2="17" />
                <line x1="14" x2="14" y1="11" y2="17" />
              </svg>
              删除
            </ToolBtn>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {record.inputImages.map((img, index) => (
            <HistoryImage
              key={img.path}
              url={getImageUrl(img)}
              path={img.path}
              index={index}
              images={inputImageList}
              onPreview={() => handleInputPreview(index)}
            />
          ))}
        </div>

        <p className="text-sm leading-6 text-foreground">{record.promptText}</p>

        {record.outputImages.length > 0 && (
          <div className={cn('flex flex-wrap gap-3')}>
            {record.outputImages.map((img, index) => (
              <OutputImageCard
                key={img.path}
                url={getImageUrl(img)}
                path={img.path}
                mimeType={img.mimeType}
                onPreview={() => handleOutputPreview(index)}
                aspectRatio={record.aspectRatio}
                status={img.error ? 'failed' : 'ready'}
                error={img.error}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="删除历史记录"
        description="确定要删除这条历史记录吗？将同时删除关联的缓存图片，此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
