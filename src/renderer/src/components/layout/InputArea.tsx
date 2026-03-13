import { Button } from '@/components/ui/button'
import { PromptInputSection } from '@/components/input/PromptInputSection'
import { ImageUploadSection } from '@/components/input/ImageUploadSection'
import { usePasteImage } from '@/hooks/use-paste-image'
import { useDropZone } from '@/hooks/use-drop-zone'
import { useInputStore } from '@/hooks/use-input-store'
import { submitGenerationRequest } from '@/services/submit-generation'
import { inputStore } from '@/store/input-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function InputArea() {
  const handlePaste = usePasteImage()
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDropZone()
  const { promptText, submittingCount, lastGenerationError } = useInputStore()

  const hasPrompt = promptText.trim().length > 0
  const canSubmit = hasPrompt

  const handleSubmit = async () => {
    if (!canSubmit) return

    let result
    try {
      result = await submitGenerationRequest()
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败，请稍后重试'
      inputStore.setLastGenerationError(message)
      return
    }

    if (result.success) {
      inputStore.clearLastGenerationError()
      toast.success('生成成功')
    } else if (result.error) {
      inputStore.setLastGenerationError(result.error)
    }
  }

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-3 border-t border-border/80 bg-background/82 p-4 backdrop-blur transition-colors',
        isDragging && 'bg-primary/6 ring-2 ring-primary/25 ring-inset'
      )}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <PromptInputSection />

      {lastGenerationError && (
        <div className="flex w-full items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 shadow-[0_1px_2px_rgba(220,38,38,0.05)]">
          <span className="min-w-0 flex-1 break-words text-xs leading-5 text-destructive">
            {lastGenerationError}
          </span>
          <button
            type="button"
            onClick={() => inputStore.clearLastGenerationError()}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="关闭"
          >
            x
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <ImageUploadSection />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {submittingCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              {`后台还有 ${submittingCount} 个任务在生成，可继续提交新需求`}
            </span>
          ) : !hasPrompt ? (
            <span className="text-xs text-muted-foreground">请输入提示词</span>
          ) : null}
          <Button
            size="default"
            className="min-w-28 gap-1.5 rounded-xl px-5 text-sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submittingCount > 0 ? `继续生成 (${submittingCount})` : '生成'}
          </Button>
        </div>
      </div>
    </div>
  )
}
