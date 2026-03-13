import { useSyncExternalStore } from 'react'
import { inputStore } from '@/store/input-store'

export function useInputStore() {
  const promptText = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getPromptText(),
    () => inputStore.getPromptText()
  )

  const inputImages = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getInputImages(),
    () => inputStore.getInputImages()
  )

  const aspectRatio = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getAspectRatio(),
    () => inputStore.getAspectRatio()
  )

  const resolutionPreset = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getResolutionPreset(),
    () => inputStore.getResolutionPreset()
  )

  const outputCount = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getOutputCount(),
    () => inputStore.getOutputCount()
  )

  const isSubmitting = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getIsSubmitting(),
    () => inputStore.getIsSubmitting()
  )

  const submittingCount = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getSubmittingCount(),
    () => inputStore.getSubmittingCount()
  )

  const lastGenerationError = useSyncExternalStore(
    inputStore.subscribeInput,
    () => inputStore.getLastGenerationError(),
    () => inputStore.getLastGenerationError()
  )

  return {
    promptText,
    inputImages,
    aspectRatio,
    resolutionPreset,
    outputCount,
    isSubmitting,
    submittingCount,
    lastGenerationError,
    setPromptText: inputStore.setPromptText,
    setAspectRatio: inputStore.setAspectRatio,
    setResolutionPreset: inputStore.setResolutionPreset,
    setOutputCount: inputStore.setOutputCount,
    addImages: inputStore.addImages,
    removeImage: inputStore.removeImage,
    getInputState: inputStore.getInputState,
    setSubmitting: inputStore.setSubmitting
  }
}

export function usePreviewStore() {
  const state = useSyncExternalStore(
    inputStore.subscribePreview,
    () => inputStore.getPreviewState(),
    () => inputStore.getPreviewState()
  )

  return {
    ...state,
    openPreview: inputStore.openPreview,
    closePreview: inputStore.closePreview,
    setPreviewIndex: inputStore.setPreviewIndex
  }
}
