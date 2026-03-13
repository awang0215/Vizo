import type { InputImage } from './input'
import type { ModelId } from './config'

/** ����ͼƬ���ݣ��������� */
export interface InlineImagePart {
  mimeType: string
  base64: string
}

/** ����������������� */
export interface GenerationRequestParams {
  model: ModelId
  configId: string
  apiKey: string
  baseUrl: string
  proModelOverride: string
  flashModelOverride: string
  promptText: string
  inputImagesBase64: InlineImagePart[]
  aspectRatio: string
  resolutionPreset: string
  outputCount: number
}

/** ���ɽ������ͼ */
export interface GeneratedImage {
  mimeType: string
  base64: string
}

/** ������������Ӧ */
export interface GenerationResponse {
  success: boolean
  images?: GeneratedImage[]
  error?: string
}
