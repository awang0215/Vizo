export const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const
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
      message: `不支持的文件格式，仅支持：${ALLOWED_EXTENSIONS.join('、')}`
    }
  }
  return { valid: true }
}

export function validateImageCount(current: number, add: number): ValidationResult {
  const total = current + add
  if (total > MAX_IMAGES) {
    return {
      valid: false,
      message: `最多支持 ${MAX_IMAGES} 张图片，当前已有 ${current} 张，无法再添加`
    }
  }
  return { valid: true }
}
