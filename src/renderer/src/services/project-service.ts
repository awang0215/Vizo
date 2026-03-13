import { historyStore } from '@/store/history-store'
import { projectStore } from '@/store/project-store'

export async function createNewProject(): Promise<{ success: boolean; error?: string }> {
  if (typeof window?.electronAPI?.createProject !== 'function') {
    return { success: false, error: 'API 不可用' }
  }

  const result = await window.electronAPI.createProject()
  if (result.success) {
    await projectStore.load()
  }
  return result
}

export async function renameProjectById(
  projectId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window?.electronAPI?.renameProject !== 'function') {
    return { success: false, error: 'API 不可用' }
  }

  const result = await window.electronAPI.renameProject(projectId, name)
  if (result.success) {
    await projectStore.load()
  }
  return result
}

export async function deleteProjectById(
  projectId: string
): Promise<{ success: boolean; newSelectedId?: string | null; error?: string }> {
  if (typeof window?.electronAPI?.deleteProject !== 'function') {
    return { success: false, error: 'API 不可用' }
  }

  const result = await window.electronAPI.deleteProject(projectId)
  if (result.success) {
    await projectStore.load()
    await historyStore.load()
  }
  return result
}
