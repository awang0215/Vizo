import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useProjectStore } from '@/hooks/use-project-store'
import { projectStore } from '@/store/project-store'
import { generateId } from '@/utils/id'
import type { Project } from '@/types/project'
import type { PromptPreset } from '@/types/prompt-preset'
import {
  getPromptPresetDisplayTitle,
  readPromptPresetState,
  type ProjectWithPromptPresets
} from '@/utils/prompt-preset'
import { PromptPresetDialog } from '@/components/right/PromptPresetDialog'

function updateProjectPromptPresetState(
  projects: Project[],
  selectedProjectId: string,
  updater: (project: ProjectWithPromptPresets) => ProjectWithPromptPresets
) {
  const nextProjects = projects.map((project) => {
    if (project.id !== selectedProjectId) return project
    return updater(project as ProjectWithPromptPresets)
  })

  projectStore.setProjectsAndSelected(nextProjects, selectedProjectId)
}

export function PromptPresetSection() {
  const { projects, selectedProject, selectedProjectId } = useProjectStore()
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)

  const { promptPresets, selectedPromptPresetIds } = useMemo(
    () => readPromptPresetState(selectedProject),
    [selectedProject]
  )

  const editingPreset = useMemo(
    () => promptPresets.find((preset) => preset.id === editingPresetId) ?? null,
    [promptPresets, editingPresetId]
  )

  useEffect(() => {
    if (editingPresetId && !promptPresets.some((preset) => preset.id === editingPresetId)) {
      setEditingPresetId(null)
    }
  }, [editingPresetId, promptPresets])

  const handleCreatePreset = () => {
    if (!selectedProjectId) return

    const nextPreset: PromptPreset = {
      id: generateId(),
      title: '',
      content: ''
    }

    updateProjectPromptPresetState(projects, selectedProjectId, (project) => {
      const currentState = readPromptPresetState(project)
      return {
        ...project,
        promptPresets: [...currentState.promptPresets, nextPreset],
        selectedPromptPresetIds: currentState.selectedPromptPresetIds
      }
    })

    setEditingPresetId(nextPreset.id)
  }

  const handleTogglePreset = (presetId: string) => {
    if (!selectedProjectId) return

    updateProjectPromptPresetState(projects, selectedProjectId, (project) => {
      const currentState = readPromptPresetState(project)
      const alreadySelected = currentState.selectedPromptPresetIds.includes(presetId)
      const nextSelectedPromptPresetIds = alreadySelected
        ? currentState.selectedPromptPresetIds.filter((id) => id !== presetId)
        : [...currentState.selectedPromptPresetIds, presetId]

      return {
        ...project,
        promptPresets: currentState.promptPresets,
        selectedPromptPresetIds: nextSelectedPromptPresetIds
      }
    })
  }

  const handleAutoSave = (
    presetId: string,
    patch: Pick<PromptPreset, 'title' | 'content'>
  ) => {
    if (!selectedProjectId) return

    updateProjectPromptPresetState(projects, selectedProjectId, (project) => {
      const currentState = readPromptPresetState(project)
      return {
        ...project,
        promptPresets: currentState.promptPresets.map((preset) =>
          preset.id === presetId ? { ...preset, ...patch } : preset
        ),
        selectedPromptPresetIds: currentState.selectedPromptPresetIds
      }
    })
  }

  const handleClear = (presetId: string) => {
    handleAutoSave(presetId, { title: editingPreset?.title ?? '', content: '' })
  }

  return (
    <section className="section-card flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="section-title">前置提示词</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCreatePreset}
          disabled={!selectedProjectId}
        >
          新建
        </Button>
      </div>

      {!selectedProjectId ? (
        <div className="empty-state-card">
          请先新建或选择项目，再为当前项目设置前置提示词
        </div>
      ) : promptPresets.length === 0 ? (
        <div className="empty-state-card">当前项目还没有前置提示词</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {promptPresets.map((preset, index) => {
            const isSelected = selectedPromptPresetIds.includes(preset.id)

            return (
              <button
                key={preset.id}
                type="button"
                className={cn(
                  'interactive-row flex items-center gap-2 px-3 py-2.5 text-left',
                  isSelected && 'interactive-row-selected'
                )}
                onClick={() => handleTogglePreset(preset.id)}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {getPromptPresetDisplayTitle(preset, index)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    setEditingPresetId(preset.id)
                  }}
                >
                  编辑
                </Button>
              </button>
            )
          })}
        </div>
      )}

      <PromptPresetDialog
        open={!!editingPreset}
        preset={editingPreset}
        onOpenChange={(open) => {
          if (!open) setEditingPresetId(null)
        }}
        onAutoSave={handleAutoSave}
        onClear={handleClear}
      />
    </section>
  )
}
