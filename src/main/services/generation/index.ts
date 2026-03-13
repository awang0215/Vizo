import { generateWithGoogleAdapter } from './google-generative-adapter'
import type { ModelId } from './model-resolver'

export interface GenerationRequest {
  modelId: ModelId
  apiKey: string
  baseUrl: string
  proModelOverride: string
  flashModelOverride: string
  promptText: string
  inputImagesBase64: Array<{ mimeType: string; base64: string }>
  resolutionPreset: string
  outputCount: number
  aspectRatio: string
}

export interface GenerationResponse {
  success: boolean
  images?: Array<{ mimeType: string; base64: string }>
  error?: string
}

/**
 * ����������� - provider ���
 * ��ǰʹ�� Google ����������������չ���� provider
 */
export async function executeGeneration(
  request: GenerationRequest
): Promise<GenerationResponse> {
  return generateWithGoogleAdapter({
    modelId: request.modelId,
    apiKey: request.apiKey,
    baseUrl: request.baseUrl,
    proModelOverride: request.proModelOverride,
    flashModelOverride: request.flashModelOverride,
    promptText: request.promptText,
    inputImagesBase64: request.inputImagesBase64,
    resolutionPreset: request.resolutionPreset,
    outputCount: request.outputCount,
    aspectRatio: request.aspectRatio || '1:1'
  })
}
