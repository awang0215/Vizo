import type { ModelId } from './config'

/** ��ʷ��¼�е�ͼƬ���ã�������·����չʾ URL�� */
export interface HistoryImageRef {
  path: string
  mimeType: string
  displayUrl?: string
  error?: string
}

/** ������ʷ��¼���־û��ṹ�� */
export interface HistoryRecord {
  id: string
  projectId: string
  userPromptText?: string
  promptText: string
  inputImages: HistoryImageRef[]
  outputImages: HistoryImageRef[]
  model: ModelId
  configId: string
  aspectRatio: string
  resolutionPreset: string
  outputCount: number
  createdAt: string
}
