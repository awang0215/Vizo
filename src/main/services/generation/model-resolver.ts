/** Ĭ�Ϲٷ�ģ������Nano Banana Pro / 2 ��Ӧ�� */
export const DEFAULT_PRO_MODEL = 'gemini-3-pro-image-preview'
export const DEFAULT_FLASH_MODEL = 'gemini-3.1-flash-image-preview'

export type ModelId = 'nano-banana-pro' | 'nano-banana-2'

/**
 * ��������ʹ�õ�ģ����
 * ����ʹ�����ø��ǣ�����ʹ��Ĭ�Ϲٷ�ģ����
 */
export function resolveModelName(
  modelId: ModelId,
  proOverride: string,
  flashOverride: string
): string {
  if (modelId === 'nano-banana-pro') {
    const trimmed = proOverride?.trim()
    return trimmed || DEFAULT_PRO_MODEL
  }
  if (modelId === 'nano-banana-2') {
    const trimmed = flashOverride?.trim()
    return trimmed || DEFAULT_FLASH_MODEL
  }
  return DEFAULT_PRO_MODEL
}
