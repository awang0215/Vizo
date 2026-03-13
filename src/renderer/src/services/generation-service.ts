import type { Config } from '@/types/config'
import type { GenerationPayload } from '@/types/input'
import { fileToBase64 } from '@/utils/file-to-base64'

export async function requestGeneration(
  payload: GenerationPayload,
  config: Config,
  preparedInputImagesBase64?: Array<{ mimeType: string; base64: string }>
): Promise<{ success: boolean; images?: Array<{ mimeType: string; base64: string }>; error?: string }> {
  const inputImagesBase64 =
    preparedInputImagesBase64 ??
    (await Promise.all(payload.inputImages.map((image) => fileToBase64(image.file))))

  const baseUrl = config.url?.trim() || ''
  const request = {
    modelId: payload.model,
    apiKey: config.apiKey,
    baseUrl,
    proModelOverride: config.proModelNameOverride ?? '',
    flashModelOverride: config.flashModelNameOverride ?? '',
    promptText: payload.promptText,
    inputImagesBase64,
    resolutionPreset: payload.resolutionPreset,
    outputCount: payload.outputCount,
    aspectRatio: payload.aspectRatio || '1:1'
  }

  if (typeof window?.electronAPI?.executeGeneration !== 'function') {
    return { success: false, error: 'Electron API 不可用' }
  }

  return window.electronAPI.executeGeneration(request)
}
