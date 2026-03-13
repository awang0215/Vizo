/** ��ǰ����������ͼƬ */
import type { ModelId } from './config'

export interface InputImage {
  id: string
  file: File
  previewUrl: string
}

/** ͼƬ����Ԥ�� */
export type AspectRatio =
  | '1:1'
  | '9:16'
  | '16:9'
  | '3:4'
  | '4:3'
  | '21:9'

/** �ֱ���Ԥ�赵λ */
export type ResolutionPreset = '1K' | '2K' | '4K'

/** ������� */
export type OutputCount = 1 | 2 | 4 | 8

/** Ԥ��״̬ */
export type PreviewSource = 'input' | 'history'

export interface PreviewImage {
  id?: string
  url: string
  /** ����·�������ڴ������ļ��У�����ʷ���ͼ�У� */
  path?: string
}

export interface PreviewState {
  open: boolean
  index: number
  images: PreviewImage[]
  source: PreviewSource
}

/** ��ǰ����״̬���������߼���ȡ�� */
export interface InputState {
  promptText: string
  inputImages: InputImage[]
  aspectRatio: AspectRatio
  resolutionPreset: ResolutionPreset
  outputCount: OutputCount
  isSubmitting: boolean
}

/** �����ύ�غ� */
export interface GenerationPayload {
  model: ModelId
  configId: string
  userPromptText: string
  promptText: string
  inputImages: InputImage[]
  aspectRatio: AspectRatio
  resolutionPreset: ResolutionPreset
  outputCount: OutputCount
}

/** У���� */
export interface ValidationResult {
  passed: boolean
  error?: string
  payload?: GenerationPayload
}

export type { ModelId }
