import { deleteProjectCache } from '../storage/file-cache-service'
import { loadHistory, saveHistory } from '../storage/history-storage'
import { loadProjects, saveProjects, type Project } from '../storage/project-storage'
import { generateId } from '../utils/id'

export interface CreateProjectResult {
  success: boolean
  project?: Project
  error?: string
}

export async function createProject(): Promise<CreateProjectResult> {
  try {
    const state = await loadProjects()
    const usedNames = new Set(state.projects.map((project) => project.name))

    let name = 'Vizo 1'
    let index = 1
    while (usedNames.has(name)) {
      index += 1
      name = `Vizo ${index}`
    }

    const now = new Date().toISOString()
    const project: Project = {
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      previewImagePath: null,
      recordIds: []
    }

    state.projects.push(project)
    state.selectedProjectId = project.id
    await saveProjects(state)

    return { success: true, project }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function ensureFirstProject(): Promise<{ projectId: string } | null> {
  const state = await loadProjects()
  if (state.projects.length > 0) {
    return null
  }

  const result = await createProject()
  if (result.project) {
    return { projectId: result.project.id }
  }

  return null
}

export interface DeleteProjectResult {
  success: boolean
  newSelectedId?: string | null
  error?: string
}

export interface RenameProjectResult {
  success: boolean
  error?: string
}

export async function renameProject(
  projectId: string,
  name: string
): Promise<RenameProjectResult> {
  try {
    const trimmed = name.trim()
    if (!trimmed) {
      return { success: false, error: '项目名称不能为空' }
    }

    const state = await loadProjects()
    const project = state.projects.find((item) => item.id === projectId)
    if (!project) {
      return { success: false, error: '项目不存在' }
    }

    const usedNames = new Set(
      state.projects.filter((item) => item.id !== projectId).map((item) => item.name)
    )
    if (usedNames.has(trimmed)) {
      return { success: false, error: '项目名称已存在' }
    }

    project.name = trimmed
    await saveProjects(state)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function deleteProject(projectId: string): Promise<DeleteProjectResult> {
  try {
    const [projectsState, historyState] = await Promise.all([loadProjects(), loadHistory()])
    const project = projectsState.projects.find((item) => item.id === projectId)

    if (!project) {
      return { success: false, error: '项目不存在' }
    }

    await deleteProjectCache(projectId)

    projectsState.projects = projectsState.projects.filter((item) => item.id !== projectId)
    historyState.records = historyState.records.filter((record) => record.projectId !== projectId)

    let newSelectedId: string | null = projectsState.selectedProjectId
    if (projectsState.selectedProjectId === projectId) {
      newSelectedId = projectsState.projects[0]?.id ?? null
    }
    projectsState.selectedProjectId = newSelectedId

    await Promise.all([saveProjects(projectsState), saveHistory(historyState)])
    return { success: true, newSelectedId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
