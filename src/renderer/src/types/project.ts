import type { PromptPreset } from './prompt-preset'

/** 椤圭洰 */
export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  previewImagePath: string | null
  previewImageUrl?: string | null
  recordIds: string[]
  promptPresets?: PromptPreset[]
  selectedPromptPresetIds?: string[]
}
