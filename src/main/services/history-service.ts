import { loadHistory, saveHistory, type HistoryRecord, type HistoryImageRef } from '../storage/history-storage'
import { loadProjects, saveProjects } from '../storage/project-storage'
import {
  saveOutputImages,
  saveInputImages,
  deleteFiles,
  pathToDisplayUrl
} from '../storage/file-cache-service'
import { generateId } from '../utils/id'

export interface AddRecordParams {
  projectId: string
  userPromptText: string
  promptText: string
  inputImagesBase64: Array<{ mimeType: string; base64: string }>
  outputImagesBase64: Array<{ mimeType: string; base64: string; error?: string }>
  model: string
  configId: string
  aspectRatio: string
  resolutionPreset: string
  outputCount: number
}

export interface AddRecordResult {
  success: boolean
  record?: HistoryRecord
  error?: string
}

/**
 * �����ʷ��¼�����̻���
 */
export async function addHistoryRecord(params: AddRecordParams): Promise<AddRecordResult> {
  try {
    const [historyState, projectsState] = await Promise.all([
      loadHistory(),
      loadProjects()
    ])

    const project = projectsState.projects.find((p) => p.id === params.projectId)
    if (!project) {
      return { success: false, error: '��Ŀ������' }
    }

    const outputSaved = await saveOutputImages(params.projectId, params.outputImagesBase64)
    const inputSaved = await saveInputImages(params.projectId, params.inputImagesBase64)

    const record: HistoryRecord = {
      id: generateId(),
      projectId: params.projectId,
      userPromptText: params.userPromptText,
      promptText: params.promptText,
      inputImages: inputSaved,
      outputImages: outputSaved,
      model: params.model,
      configId: params.configId,
      aspectRatio: params.aspectRatio,
      resolutionPreset: params.resolutionPreset,
      outputCount: params.outputCount,
      createdAt: new Date().toISOString()
    }

    historyState.records.push(record)
    project.recordIds.push(record.id)
    project.updatedAt = record.createdAt
    project.previewImagePath = outputSaved[0]?.path ?? project.previewImagePath

    await Promise.all([saveHistory(historyState), saveProjects(projectsState)])

    const recordForRenderer = {
      ...record,
      inputImages: record.inputImages.map((i) => ({ ...i, displayUrl: pathToDisplayUrl(i.path) })),
      outputImages: record.outputImages.map((i) => ({
        ...i,
        displayUrl: pathToDisplayUrl(i.path)
      }))
    }

    return { success: true, record: recordForRenderer }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export interface DeleteRecordResult {
  success: boolean
  error?: string
}

function getLatestProjectPreviewPath(
  records: HistoryRecord[],
  projectId: string
): string | null {
  let latestRecord: HistoryRecord | null = null

  for (const record of records) {
    if (record.projectId !== projectId || !record.outputImages[0]) continue
    if (!latestRecord || new Date(record.createdAt).getTime() >= new Date(latestRecord.createdAt).getTime()) {
      latestRecord = record
    }
  }

  return latestRecord?.outputImages[0]?.path ?? null
}

/**
 * ɾ����ʷ��¼�������������
 */
export async function deleteHistoryRecord(recordId: string): Promise<DeleteRecordResult> {
  try {
    const [historyState, projectsState] = await Promise.all([
      loadHistory(),
      loadProjects()
    ])

    const record = historyState.records.find((r) => r.id === recordId)
    if (!record) {
      return { success: false, error: '��¼������' }
    }

    const pathsToDelete: string[] = [
      ...record.outputImages.map((i) => i.path),
      ...record.inputImages.map((i) => i.path)
    ]
    await deleteFiles(pathsToDelete)

    historyState.records = historyState.records.filter((r) => r.id !== recordId)

    const project = projectsState.projects.find((p) => p.id === record.projectId)
    if (project) {
      project.recordIds = project.recordIds.filter((id) => id !== recordId)
      project.previewImagePath =
        project.recordIds.length === 0
          ? null
          : getLatestProjectPreviewPath(historyState.records, project.id)
    }

    await Promise.all([saveHistory(historyState), saveProjects(projectsState)])

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
