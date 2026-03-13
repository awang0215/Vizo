import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const FILENAME = 'projects.json'

function getPath(): string {
  return join(app.getPath('userData'), FILENAME)
}

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  previewImagePath: string | null
  recordIds: string[]
  promptPresets?: Array<{
    id: string
    title: string
    content: string
  }>
  selectedPromptPresetIds?: string[]
}

export interface ProjectsState {
  projects: Project[]
  selectedProjectId: string | null
}

const DEFAULT_STATE: ProjectsState = {
  projects: [],
  selectedProjectId: null
}

export async function loadProjects(): Promise<ProjectsState> {
  try {
    const path = getPath()
    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw) as ProjectsState
    if (parsed?.projects && Array.isArray(parsed.projects)) {
      return {
        projects: parsed.projects,
        selectedProjectId: parsed.selectedProjectId ?? null
      }
    }
  } catch {
    // �ļ������ڻ����ʧ��
  }
  return { ...DEFAULT_STATE }
}

export async function saveProjects(state: ProjectsState): Promise<void> {
  const path = getPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(state, null, 2), 'utf-8')
}
