import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'
import { renameProjectById } from '@/services/project-service'
import { toast } from 'sonner'

interface ProjectItemProps {
  project: Project
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso)
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch {
    return '--'
  }
}

export function ProjectItem({
  project,
  isSelected,
  onSelect,
  onDelete
}: ProjectItemProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(project.name)
  const [previewFailed, setPreviewFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(project.name)
  }, [project.name])

  useEffect(() => {
    setPreviewFailed(false)
  }, [project.previewImageUrl, project.id])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const handleSave = async () => {
    setEditing(false)
    const trimmed = value.trim()
    if (!trimmed) {
      setValue(project.name)
      return
    }
    if (trimmed === project.name) return

    const result = await renameProjectById(project.id, trimmed)
    if (result.success) {
      toast.success('已重命名')
    } else if (result.error) {
      toast.error(result.error)
      setValue(project.name)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') handleSave()
    if (event.key === 'Escape') {
      setEditing(false)
      setValue(project.name)
    }
  }

  const thumbnailUrl = project.previewImageUrl ?? null

  return (
    <div
      className={cn(
        'interactive-row group flex items-center gap-3 px-2.5 py-2.5',
        isSelected && 'interactive-row-selected'
      )}
      onClick={() => !editing && onSelect()}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30">
        {thumbnailUrl && !previewFailed ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-medium text-muted-foreground">
            暂无
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <Input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(event) => event.stopPropagation()}
            className="h-8 text-sm"
          />
        ) : (
          <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(project.updatedAt)}
        </p>
      </div>
      {!editing && (
        <>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-70 transition-colors hover:bg-accent/80 hover:text-foreground group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation()
              setEditing(true)
            }}
            title="重命名"
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-70 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            title="删除项目"
          >
            <span className="text-xs">删除</span>
          </button>
        </>
      )}
    </div>
  )
}
