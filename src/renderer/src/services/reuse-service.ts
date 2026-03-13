import { toast } from 'sonner'
import { inputStore } from '@/store/input-store'
import { dataURLtoFile } from '@/utils/data-url'
import { validateImageCount, validateImageFile } from '@/utils/image-input-validate-safe'

export async function reuseFromRecord(
  promptText: string,
  inputImagePaths: Array<{ path: string; mimeType: string }>
): Promise<{ success: boolean; error?: string }> {
  if (typeof window?.electronAPI?.readCacheFile !== 'function') {
    return { success: false, error: 'API 不可用' }
  }

  if (inputImagePaths.length === 0) {
    inputStore.setPromptText(promptText)
    inputStore.clearImages()
    return { success: true }
  }

  const files: File[] = []
  for (let index = 0; index < inputImagePaths.length; index += 1) {
    const image = inputImagePaths[index]
    const data = await window.electronAPI.readCacheFile(image.path)
    if (!data) {
      toast.error(`输入图 ${index + 1} 文件已不存在，无法复用`)
      continue
    }

    const dataUrl = `data:${data.mimeType};base64,${data.base64}`
    const ext = data.mimeType.includes('png')
      ? 'png'
      : data.mimeType.includes('webp')
        ? 'webp'
        : 'jpg'
    files.push(dataURLtoFile(dataUrl, `reuse-${index}.${ext}`))
  }

  if (files.length === 0) {
    return { success: false, error: '所有输入图片文件均已不存在' }
  }

  const { valid, message } = validateImageCount(0, files.length)
  if (!valid) {
    toast.error(message)
    return { success: false, error: message }
  }

  const validatedFiles: File[] = []
  for (const file of files) {
    const { valid: fileValid, message: fileMessage } = validateImageFile(file)
    if (!fileValid) {
      toast.error(`${file.name}: ${fileMessage}`)
      continue
    }
    validatedFiles.push(file)
  }

  if (validatedFiles.length === 0) {
    return { success: false, error: '可复用的输入图片不可用' }
  }

  inputStore.setPromptText(promptText)
  inputStore.clearImages()
  await inputStore.addImages(validatedFiles)

  return { success: true }
}
