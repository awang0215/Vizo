import { toast } from 'sonner'
import type { GenerationPayload } from '@/types/input'
import type { GeneratingOutputSlot } from '@/store/generating-store'
import { requestGeneration } from './generation-service'
import { configStoreV2 } from '@/store/config-store-v2'
import { generatingStore } from '@/store/generating-store'
import { historyStore } from '@/store/history-store'
import { inputStore } from '@/store/input-store'
import { projectStore } from '@/store/project-store'
import { validateGenerationInput } from '@/utils/generation-validate'
import { fileToBase64 } from '@/utils/file-to-base64'
import { generateId } from '@/utils/id'

const DELAY_MS = 1000
const FALLBACK_PLACEHOLDER_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+X8UAAAAASUVORK5CYII='

type PlaceholderKind = 'loading' | 'failed'

interface PlaceholderImage {
  mimeType: string
  base64: string
  displayUrl: string
}

interface PersistedOutputImage {
  mimeType: string
  base64: string
  error?: string
}

const placeholderImageCache = new Map<string, PlaceholderImage>()

export interface SubmitResult {
  success: boolean
  payload?: GenerationPayload
  error?: string
}

function presentGenerationError(error?: string): string {
  const trimmed = error?.trim()
  if (trimmed) return trimmed
  return '生成失败，请检查配置、网络或图片内容后重试'
}

function parseAspectRatio(aspectRatio: string): [number, number] {
  const [widthText, heightText] = aspectRatio.split(':')
  const width = Number(widthText)
  const height = Number(heightText)

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return [16, 9]
  }

  return [width, height]
}

function getCanvasSize(aspectRatio: string): { width: number; height: number } {
  const [ratioWidth, ratioHeight] = parseAspectRatio(aspectRatio)
  const maxEdge = 900

  if (ratioWidth >= ratioHeight) {
    return {
      width: maxEdge,
      height: Math.max(320, Math.round((maxEdge * ratioHeight) / ratioWidth))
    }
  }

  return {
    width: Math.max(320, Math.round((maxEdge * ratioWidth) / ratioHeight)),
    height: maxEdge
  }
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function createPlaceholderImage(aspectRatio: string, kind: PlaceholderKind): PlaceholderImage {
  const cacheKey = `${kind}:${aspectRatio}`
  const cached = placeholderImageCache.get(cacheKey)
  if (cached) return cached

  try {
    const canvas = document.createElement('canvas')
    const { width, height } = getCanvasSize(aspectRatio)
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas context unavailable')

    const backgroundGradient = context.createLinearGradient(0, 0, width, height)
    backgroundGradient.addColorStop(0, '#ffffff')
    backgroundGradient.addColorStop(0.55, '#f7fbff')
    backgroundGradient.addColorStop(1, '#eef4ff')
    context.fillStyle = backgroundGradient
    context.fillRect(0, 0, width, height)

    context.globalAlpha = 0.72
    context.fillStyle = kind === 'loading' ? '#dbeafe' : '#fee2e2'
    context.beginPath()
    context.arc(width * 0.18, height * 0.22, Math.min(width, height) * 0.22, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = kind === 'loading' ? '#eff6ff' : '#fff1f2'
    context.beginPath()
    context.arc(width * 0.82, height * 0.8, Math.min(width, height) * 0.2, 0, Math.PI * 2)
    context.fill()
    context.globalAlpha = 1

    const frameMargin = Math.max(18, Math.min(width, height) * 0.08)
    drawRoundedRect(
      context,
      frameMargin,
      frameMargin,
      width - frameMargin * 2,
      height - frameMargin * 2,
      Math.min(width, height) * 0.08
    )
    context.fillStyle = 'rgba(255, 255, 255, 0.84)'
    context.fill()
    context.lineWidth = Math.max(2, Math.min(width, height) * 0.008)
    context.strokeStyle =
      kind === 'loading' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(239, 68, 68, 0.18)'
    context.stroke()

    const centerX = width / 2
    const iconY = height * 0.38
    const iconRadius = Math.max(34, Math.min(width, height) * 0.12)
    const iconGradient = context.createLinearGradient(
      centerX - iconRadius,
      iconY - iconRadius,
      centerX + iconRadius,
      iconY + iconRadius
    )

    if (kind === 'loading') {
      iconGradient.addColorStop(0, '#60a5fa')
      iconGradient.addColorStop(1, '#2563eb')
    } else {
      iconGradient.addColorStop(0, '#f97316')
      iconGradient.addColorStop(1, '#ef4444')
    }

    context.beginPath()
    context.arc(centerX, iconY, iconRadius, 0, Math.PI * 2)
    context.fillStyle = iconGradient
    context.fill()

    context.fillStyle = 'rgba(255, 255, 255, 0.96)'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `700 ${Math.max(24, iconRadius * 0.95)}px "SF Pro Display", "PingFang SC", sans-serif`
    context.fillText(kind === 'loading' ? '...' : '!', centerX, iconY + 1)

    const titleSize = Math.max(28, Math.min(width, height) * 0.11)
    const subtitleSize = Math.max(15, Math.min(width, height) * 0.052)

    context.fillStyle = '#0f172a'
    context.font = `600 ${titleSize}px "SF Pro Display", "PingFang SC", sans-serif`
    context.fillText(kind === 'loading' ? '生成中' : '生成失败', centerX, height * 0.62)

    context.fillStyle = '#64748b'
    context.font = `400 ${subtitleSize}px "SF Pro Display", "PingFang SC", sans-serif`
    context.fillText(
      kind === 'loading' ? 'Vizo 正在生成图片' : '请悬停查看错误详情',
      centerX,
      height * 0.74
    )

    const displayUrl = canvas.toDataURL('image/png')
    const base64 = displayUrl.split(',')[1] ?? FALLBACK_PLACEHOLDER_BASE64
    const image = { mimeType: 'image/png', base64, displayUrl }
    placeholderImageCache.set(cacheKey, image)
    return image
  } catch {
    const fallback = {
      mimeType: 'image/png',
      base64: FALLBACK_PLACEHOLDER_BASE64,
      displayUrl: `data:image/png;base64,${FALLBACK_PLACEHOLDER_BASE64}`
    }
    placeholderImageCache.set(cacheKey, fallback)
    return fallback
  }
}

function getLoadingPlaceholder(aspectRatio: string): PlaceholderImage {
  return createPlaceholderImage(aspectRatio, 'loading')
}

function getFailedPlaceholder(aspectRatio: string): PlaceholderImage {
  return createPlaceholderImage(aspectRatio, 'failed')
}

function buildLoadingSlots(total: number, aspectRatio: string): GeneratingOutputSlot[] {
  const placeholder = getLoadingPlaceholder(aspectRatio)

  return Array.from({ length: total }, () => ({
    status: 'loading',
    displayUrl: placeholder.displayUrl
  }))
}

async function ensureProjectForHistory(recordId: string): Promise<string | null> {
  if (typeof window?.electronAPI?.ensureFirstProject !== 'function') {
    return null
  }

  const first = await window.electronAPI.ensureFirstProject()
  if (!first?.projectId) return null

  await projectStore.load()
  generatingStore.setProjectId(recordId, first.projectId)

  return first.projectId
}

export async function submitGenerationRequest(): Promise<SubmitResult> {
  const state = inputStore.getInputState()
  const configState = configStoreV2.getState()
  const selectedConfig =
    configState.configs.find((config) => config.id === configState.selectedConfigId) ?? null

  const result = validateGenerationInput(state, configState.selectedModel, selectedConfig)

  if (!result.passed || !result.payload || !selectedConfig) {
    return { success: false, error: result.error ?? '校验失败' }
  }

  let projectId = projectStore.getSelectedProjectId()
  if (!projectId && projectStore.getProjects().length > 0) {
    return { success: false, error: '请先选择项目' }
  }

  let generationId: string | null = null
  inputStore.setSubmitting(true)

  try {
    const outputCount = Math.max(1, Math.min(8, result.payload.outputCount))
    const aspectRatio = result.payload.aspectRatio || '16:9'
    generationId = generateId()

    const inputImagesBase64 = await Promise.all(
      result.payload.inputImages.map((image) => fileToBase64(image.file))
    )

    const inputImagesForDisplay = result.payload.inputImages.map((image, index) => ({
      path: '',
      mimeType: inputImagesBase64[index]?.mimeType ?? 'image/png',
      displayUrl: image.previewUrl
    }))

    generatingStore.add({
      id: generationId,
      projectId: projectId ?? '',
      promptText: result.payload.promptText,
      inputImages: inputImagesForDisplay,
      outputSlots: buildLoadingSlots(outputCount, aspectRatio),
      aspectRatio,
      total: outputCount,
      successCount: 0,
      failedCount: 0,
      status: 'generating',
      createdAt: new Date().toISOString()
    })

    const collectedImages: PersistedOutputImage[] = []
    let generatedImageCount = 0
    let hasFailure = false
    let lastErrorMessage = ''

    const appendFailedPlaceholder = (index: number, error?: string) => {
      hasFailure = true
      const message = presentGenerationError(error)
      lastErrorMessage = message
      const fallback = getFailedPlaceholder(aspectRatio)

      collectedImages.push({
        mimeType: fallback.mimeType,
        base64: fallback.base64,
        error: message
      })

      generatingStore.failOutput(generationId!, index, fallback, message)
    }

    for (let index = 0; index < outputCount; index += 1) {
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
      }

      let generationResult: Awaited<ReturnType<typeof requestGeneration>>
      try {
        generationResult = await requestGeneration(
          { ...result.payload, outputCount: 1 },
          selectedConfig,
          inputImagesBase64
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        appendFailedPlaceholder(index, message)
        continue
      }

      const image = generationResult.images?.[0]
      if (!generationResult.success || !image) {
        appendFailedPlaceholder(index, generationResult.error)
        continue
      }

      const displayUrl = `data:${image.mimeType};base64,${image.base64}`
      collectedImages.push(image)
      generatedImageCount += 1
      generatingStore.resolveOutput(generationId, index, { ...image, displayUrl })
    }

    if (generatedImageCount === 0 && lastErrorMessage) {
      generatingStore.setStatus(generationId, 'partial_failure')
      return { success: false, error: lastErrorMessage }
    }

    if (collectedImages.length === 0) {
      generatingStore.setStatus(generationId, 'partial_failure')
      return { success: false, error: '生成失败，未返回任何图片' }
    }

    if (!projectId) {
      projectId = await ensureProjectForHistory(generationId)
      if (!projectId) {
        generatingStore.setStatus(generationId, 'partial_failure')
        return {
          success: false,
          error: '生成成功，但保存历史记录失败，请先创建项目后重试'
        }
      }
    }

    generatingStore.setStatus(generationId, hasFailure ? 'partial_failure' : 'completed')
    if (hasFailure) {
      toast.warning('部分图片生成失败')
    }

    const addResult = await window.electronAPI.addHistoryRecord({
      projectId,
      userPromptText: result.payload.userPromptText,
      promptText: result.payload.promptText,
      inputImagesBase64,
      outputImagesBase64: collectedImages,
      model: result.payload.model,
      configId: result.payload.configId,
      aspectRatio: result.payload.aspectRatio,
      resolutionPreset: result.payload.resolutionPreset,
      outputCount
    })

    if (!addResult.success) {
      generatingStore.setStatus(generationId, 'partial_failure')
      return {
        success: false,
        error: addResult.error?.trim() || '生成成功，但保存历史记录失败'
      }
    }

    await historyStore.load()
    await projectStore.load()

    generatingStore.remove(generationId)
    return { success: true, payload: result.payload }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const current =
      generationId === null
        ? null
        : generatingStore.get().find((record) => record.id === generationId) ?? null

    if (current) {
      const fallback = getFailedPlaceholder(current.aspectRatio)
      const normalizedMessage = presentGenerationError(message)

      current.outputSlots.forEach((slot, index) => {
        if (slot.status === 'loading') {
          generatingStore.failOutput(current.id, index, fallback, normalizedMessage)
        }
      })

      generatingStore.setStatus(current.id, 'partial_failure')
    }

    return { success: false, error: presentGenerationError(message) }
  } finally {
    inputStore.setSubmitting(false)
    const current =
      generationId === null
        ? null
        : generatingStore.get().find((record) => record.id === generationId) ?? null

    if (current && current.status !== 'generating') {
      setTimeout(() => generatingStore.remove(current.id), 3000)
    }
  }
}
