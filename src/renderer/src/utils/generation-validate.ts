import type { Config } from '@/types/config'
import type { GenerationPayload, InputState, ModelId } from '@/types/input'
import { buildGenerationPayload } from './build-generation-payload'

export interface ValidationResult {
  passed: boolean
  error?: string
  payload?: GenerationPayload
}

export function validateGenerationInput(
  state: InputState,
  selectedModel: ModelId,
  selectedConfig: Config | null
): ValidationResult {
  const trimmed = state.promptText.trim()
  if (!trimmed) {
    return {
      passed: false,
      error: '提示词不能为空'
    }
  }

  if (!selectedConfig) {
    return {
      passed: false,
      error: '请先选择配置'
    }
  }

  const payload = buildGenerationPayload(state, selectedModel, selectedConfig)
  if (!payload) {
    return { passed: false, error: '未知错误' }
  }

  return {
    passed: true,
    payload
  }
}
