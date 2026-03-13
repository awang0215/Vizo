/** ��֤״̬ */
export type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error'

/** ������ */
export interface Config {
  id: string
  name: string
  apiKey: string
  url: string
  /** Pro ģ�������ǣ������ʹ��Ĭ�Ϲٷ�ģ���� */
  proModelNameOverride?: string
  /** Banana 2 ģ�������ǣ������ʹ��Ĭ�Ϲٷ�ģ���� */
  flashModelNameOverride?: string
  lastVerifiedAt: string | null
  verifyStatus: VerifyStatus
}

/** ģ�� */
export type ModelId = 'nano-banana-pro' | 'nano-banana-2'

/** ģ����ʾ�� */
export const MODEL_LABELS: Record<ModelId, string> = {
  'nano-banana-pro': 'Nano Banana Pro',
  'nano-banana-2': 'Nano Banana 2'
}

/** �־û����ݽṹ */
export interface PersistedState {
  configs: Config[]
  selectedConfigId: string | null
  selectedModel: ModelId
}
