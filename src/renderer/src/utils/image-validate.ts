export const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const
export const MAX_SIZE_BYTES = 6 * 1024 * 1024 // 6MB
export const MAX_IMAGES = 14

export interface ValidationResult {
  valid: boolean
  message?: string
}

export function validateImageFile(file: File): ValidationResult {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      message: `��֧�ֵ��ļ���ʽ����֧�֣�${ALLOWED_EXTENSIONS.join('��')}`
    }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return {
      valid: false,
      message: `����ͼƬ���ܳ��� 6MB����ǰ�ļ���${(file.size / 1024 / 1024).toFixed(2)}MB`
    }
  }
  return { valid: true }
}

export function validateImageCount(current: number, add: number): ValidationResult {
  const total = current + add
  if (total > MAX_IMAGES) {
    return {
      valid: false,
      message: `���֧�� ${MAX_IMAGES} ��ͼƬ����ǰ���� ${current} �ţ��޷������`
    }
  }
  return { valid: true }
}
