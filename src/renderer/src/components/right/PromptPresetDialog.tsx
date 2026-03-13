import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PromptPreset } from '@/types/prompt-preset'

interface PromptPresetDialogProps {
  open: boolean
  preset: PromptPreset | null
  onOpenChange: (open: boolean) => void
  onAutoSave: (presetId: string, patch: Pick<PromptPreset, 'title' | 'content'>) => void
  onClear: (presetId: string) => void
}

export function PromptPresetDialog({
  open,
  preset,
  onOpenChange,
  onAutoSave,
  onClear
}: PromptPresetDialogProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const lastSyncedRef = useRef({ title: '', content: '' })

  useEffect(() => {
    if (!open || !preset) return

    setTitle(preset.title)
    setContent(preset.content)
    lastSyncedRef.current = {
      title: preset.title,
      content: preset.content
    }
  }, [open, preset])

  useEffect(() => {
    if (!open || !preset) return

    const nextValue = { title, content }
    if (
      nextValue.title === lastSyncedRef.current.title &&
      nextValue.content === lastSyncedRef.current.content
    ) {
      return
    }

    const timerId = window.setTimeout(() => {
      onAutoSave(preset.id, nextValue)
      lastSyncedRef.current = nextValue
    }, 250)

    return () => window.clearTimeout(timerId)
  }, [open, preset, title, content, onAutoSave])

  const flushSave = () => {
    if (!preset) return

    const nextValue = { title, content }
    onAutoSave(preset.id, nextValue)
    lastSyncedRef.current = nextValue
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          flushSave()
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑前置提示词</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="preset-title">标题</Label>
            <Input
              id="preset-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="不填则显示默认标题"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset-content">前置提示词</Label>
            <Textarea
              id="preset-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[220px]"
              placeholder="输入固定风格、天气、场景等前置提示词"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              内容会自动保存，提交时将按已选顺序拼接到主提示词前面。
            </p>
          </div>
        </div>

        <DialogFooter className="items-center justify-between gap-2 sm:justify-between sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!preset) return
              setContent('')
              onClear(preset.id)
              lastSyncedRef.current = { title, content: '' }
            }}
          >
            清空
          </Button>

          <Button
            type="button"
            onClick={() => {
              flushSave()
              onOpenChange(false)
            }}
          >
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
