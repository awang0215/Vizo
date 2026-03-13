import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const FILENAME = 'history.json'

function getPath(): string {
  return join(app.getPath('userData'), FILENAME)
}

export interface HistoryImageRef {
  path: string
  mimeType: string
  error?: string
}

export interface HistoryRecord {
  id: string
  projectId: string
  userPromptText?: string
  promptText: string
  inputImages: HistoryImageRef[]
  outputImages: HistoryImageRef[]
  model: string
  configId: string
  aspectRatio: string
  resolutionPreset: string
  outputCount: number
  createdAt: string
}

export interface HistoryState {
  records: HistoryRecord[]
}

const DEFAULT_STATE: HistoryState = {
  records: []
}

export async function loadHistory(): Promise<HistoryState> {
  try {
    const path = getPath()
    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw) as HistoryState
    if (parsed?.records && Array.isArray(parsed.records)) {
      return parsed
    }
  } catch {
    // �ļ������ڻ����ʧ��
  }
  return { ...DEFAULT_STATE }
}

export async function saveHistory(state: HistoryState): Promise<void> {
  const path = getPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(state, null, 2), 'utf-8')
}
