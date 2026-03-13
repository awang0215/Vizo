import type { Config } from '@/types/config'
import type { GenerationPayload, InputState, ModelId } from '@/types/input'

/**
 * ���������ύ�غ�
 * ��������ʵ���ɽӿ�ֱ��ʹ��
 */
export function buildGenerationPayload(
  state: InputState,
  selectedModel: ModelId,
  selectedConfig: Config | null
): GenerationPayload | null {
  const trimmed = state.promptText.trim()
  if (!trimmed || !selectedConfig) return null

  return {
    model: selectedModel,
    configId: selectedConfig.id,
    userPromptText: trimmed,
    promptText: trimmed,
    inputImages: [...state.inputImages],
    aspectRatio: state.aspectRatio,
    resolutionPreset: state.resolutionPreset,
    outputCount: state.outputCount
  }
}
