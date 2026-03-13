import { useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useInputStore } from '@/hooks/use-input-store'
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea'
import { cn } from '@/lib/utils'

export function PromptInputSection() {
  const { promptText, setPromptText } = useInputStore()
  const { ref, adjustHeight } = useAutoResizeTextarea()

  useEffect(() => {
    adjustHeight()
  }, [promptText, adjustHeight])

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        ref={ref}
        value={promptText}
        onChange={(event) => setPromptText(event.target.value)}
        onInput={adjustHeight}
        placeholder="请输入提示词..."
        className={cn(
          'app-scrollbar min-h-[112px] max-h-[50vh] resize-none overflow-y-auto',
          'transition-[height] duration-0'
        )}
      />
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-muted-foreground">
          提示词将在提交时自动叠加前置提示词
        </span>
        <span className="text-xs text-muted-foreground/80">{promptText.trim().length} 字</span>
      </div>
    </div>
  )
}
