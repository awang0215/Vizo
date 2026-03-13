import type { Project } from '@/types/project'
import type { PromptPreset } from '@/types/prompt-preset'

export interface ProjectPromptPresetState {
  promptPresets?: PromptPreset[]
  selectedPromptPresetIds?: string[]
}

export type ProjectWithPromptPresets = Project & ProjectPromptPresetState

function normalizePromptPresets(presets: unknown): PromptPreset[] {
  if (!Array.isArray(presets)) return []

  return presets
    .filter((preset): preset is Partial<PromptPreset> & { id: string } =>
      !!preset &&
      typeof preset === 'object' &&
      typeof (preset as { id?: unknown }).id === 'string'
    )
    .map((preset) => ({
      id: preset.id,
      title: typeof preset.title === 'string' ? preset.title : '',
      content: typeof preset.content === 'string' ? preset.content : ''
    }))
}

export function readPromptPresetState(project: Project | null | undefined) {
  const nextProject = project as ProjectWithPromptPresets | null | undefined
  const promptPresets = normalizePromptPresets(nextProject?.promptPresets)
  const presetIds = new Set(promptPresets.map((preset) => preset.id))
  const selectedPromptPresetIds = Array.isArray(nextProject?.selectedPromptPresetIds)
    ? nextProject.selectedPromptPresetIds.filter((id): id is string =>
      typeof id === 'string' && presetIds.has(id)
    )
    : []

  return {
    promptPresets,
    selectedPromptPresetIds
  }
}

export function getPromptPresetDisplayTitle(preset: PromptPreset, index: number) {
  const trimmedTitle = preset.title.trim()
  if (trimmedTitle) return trimmedTitle
  return `前置提示词 ${index + 1}`
}

export function normalizePromptPresetContent(content: string) {
  const trimmedContent = content.trim()
  if (!trimmedContent) return ''

  const collapsedEnding = trimmedContent.replace(/[，。！？；、,.!?:;]+$/u, '').trim()
  if (!collapsedEnding) return ''

  return `${collapsedEnding}，`
}

export function getSelectedPromptPresetPrefix(project: Project | null | undefined) {
  const { promptPresets, selectedPromptPresetIds } = readPromptPresetState(project)

  return promptPresets
    .filter((preset) => selectedPromptPresetIds.includes(preset.id))
    .map((preset) => normalizePromptPresetContent(preset.content))
    .filter(Boolean)
    .join('')
}

export function composePromptWithPresets(
  project: Project | null | undefined,
  promptText: string
) {
  const trimmedPrompt = promptText.trim()
  const prefix = getSelectedPromptPresetPrefix(project)

  if (!prefix) return trimmedPrompt
  return `${prefix}${trimmedPrompt}`
}

export function stripPromptPresets(project: Project | null | undefined, promptText: string) {
  const trimmedPrompt = promptText.trim()
  const prefix = getSelectedPromptPresetPrefix(project)

  if (!prefix) return trimmedPrompt
  if (!trimmedPrompt.startsWith(prefix)) return trimmedPrompt

  return trimmedPrompt.slice(prefix.length).trimStart()
}
