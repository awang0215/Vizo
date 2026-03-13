import { projectStore } from '@/store/project-store'
import { composePromptWithPresets } from '@/utils/prompt-preset'
import type { Config } from '@/types/config'
import type { GenerationPayload, InputState, ModelId } from '@/types/input'

export function buildGenerationPayload(
  state: InputState,
  selectedModel: ModelId,
  selectedConfig: Config | null
): GenerationPayload | null {
  const trimmedPrompt = state.promptText.trim()
  if (!trimmedPrompt || !selectedConfig) return null

  return {
    model: selectedModel,
    configId: selectedConfig.id,
    userPromptText: trimmedPrompt,
    promptText: composePromptWithPresets(projectStore.getSelectedProject(), trimmedPrompt),
    inputImages: [...state.inputImages],
    aspectRatio: state.aspectRatio,
    resolutionPreset: state.resolutionPreset,
    outputCount: state.outputCount
  }
}
