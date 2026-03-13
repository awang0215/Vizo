import type {
  AspectRatio,
  InputImage,
  InputState,
  OutputCount,
  PreviewImage,
  PreviewState,
  ResolutionPreset
} from '@/types/input'
import { generateId } from '@/utils/id'
import { fileToDataUrl } from '@/utils/file-to-base64'
import { validateImageCount, validateImageFile } from '@/utils/image-input-validate-safe'
import { toast } from 'sonner'

let promptText = ''
let inputImages: InputImage[] = []
let aspectRatio: AspectRatio = '16:9'
let resolutionPreset: ResolutionPreset = '2K'
let outputCount: OutputCount = 1
let activeSubmissionCount = 0
let lastGenerationError = ''

const inputListeners = new Set<() => void>()

function notifyInput() {
  inputListeners.forEach((fn) => fn())
}

function clearLastGenerationErrorSilently() {
  lastGenerationError = ''
}

// Ԥ��״̬
let previewState: PreviewState = {
  open: false,
  index: 0,
  images: [],
  source: 'input'
}

const previewListeners = new Set<() => void>()

function notifyPreview() {
  previewListeners.forEach((fn) => fn())
}

// �Ѵ����� data URL ���ü�����data URL ���� revoke��������ռλ��
const urlRegistry = new Set<string>()

export const inputStore = {
  getPromptText(): string {
    return promptText
  },

  getInputImages(): InputImage[] {
    return inputImages
  },

  getInputState(): InputState {
    return {
      promptText,
      inputImages: [...inputImages],
      aspectRatio,
      resolutionPreset,
      outputCount,
      isSubmitting: activeSubmissionCount > 0
    }
  },

  getAspectRatio(): AspectRatio {
    return aspectRatio
  },

  getResolutionPreset(): ResolutionPreset {
    return resolutionPreset
  },

  getOutputCount(): OutputCount {
    return outputCount
  },

  getIsSubmitting(): boolean {
    return activeSubmissionCount > 0
  },

  getSubmittingCount(): number {
    return activeSubmissionCount
  },

  getLastGenerationError(): string {
    return lastGenerationError
  },

  setLastGenerationError(value: string): void {
    lastGenerationError = value
    notifyInput()
  },

  clearLastGenerationError(): void {
    lastGenerationError = ''
    notifyInput()
  },

  setAspectRatio(value: AspectRatio): void {
    aspectRatio = value
    clearLastGenerationErrorSilently()
    notifyInput()
  },

  setResolutionPreset(value: ResolutionPreset): void {
    resolutionPreset = value
    clearLastGenerationErrorSilently()
    notifyInput()
  },

  setOutputCount(value: OutputCount): void {
    outputCount = value
    clearLastGenerationErrorSilently()
    notifyInput()
  },

  setSubmitting(value: boolean): void {
    if (value) {
      activeSubmissionCount += 1
      lastGenerationError = ''
      notifyInput()
      return
    }

    const nextCount = Math.max(0, activeSubmissionCount - 1)
    if (nextCount === activeSubmissionCount) return

    activeSubmissionCount = nextCount
    notifyInput()
  },

  setPromptText(text: string): void {
    promptText = text
    clearLastGenerationErrorSilently()
    notifyInput()
  },

  async addImages(files: File[]): Promise<number> {
    const current = inputImages.length
    const { valid, message } = validateImageCount(current, files.length)
    if (!valid) {
      toast.error(message)
      return 0
    }

    let added = 0
    const next: InputImage[] = [...inputImages]
    for (const file of files) {
      if (current + added >= 14) break

      const { valid: fileValid, message: fileMsg } = validateImageFile(file)
      if (!fileValid) {
        toast.error(`${file.name}: ${fileMsg}`)
        continue
      }

      const id = generateId()
      const previewUrl = await fileToDataUrl(file)
      urlRegistry.add(id)
      next.push({ id, file, previewUrl })
      added++
    }

    if (added > 0) {
      inputImages = next
      clearLastGenerationErrorSilently()
      notifyInput()
    }
    return added
  },

  removeImage(id: string): void {
    const idx = inputImages.findIndex((img) => img.id === id)
    if (idx === -1) return
    urlRegistry.delete(id)
    inputImages = inputImages.filter((img) => img.id !== id)
    clearLastGenerationErrorSilently()
    notifyInput()
  },

  clearImages(): void {
    urlRegistry.clear()
    inputImages = []
    clearLastGenerationErrorSilently()
    notifyInput()
  },

  subscribeInput(fn: () => void): () => void {
    inputListeners.add(fn)
    return () => inputListeners.delete(fn)
  },

  // Ԥ��
  getPreviewState(): PreviewState {
    return previewState
  },

  openPreview(images: PreviewImage[], index: number, source: PreviewState['source']): void {
    previewState = { open: true, index, images, source }
    notifyPreview()
  },

  closePreview(): void {
    previewState = { ...previewState, open: false }
    notifyPreview()
  },

  setPreviewIndex(index: number): void {
    if (index < 0 || index >= previewState.images.length) return
    previewState = { ...previewState, index }
    notifyPreview()
  },

  subscribePreview(fn: () => void): () => void {
    previewListeners.add(fn)
    return () => previewListeners.delete(fn)
  },

  /** ��������ж��ʱ���ã�data URL ���� revoke�� */
  revokeAllUrls(): void {
    urlRegistry.clear()
  }
}
