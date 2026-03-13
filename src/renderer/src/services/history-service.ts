import { historyStore } from '@/store/history-store'
import { projectStore } from '@/store/project-store'

export async function deleteRecord(recordId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window?.electronAPI?.deleteHistoryRecord !== 'function') {
    return { success: false, error: 'API 不可用' }
  }
  const result = await window.electronAPI.deleteHistoryRecord(recordId)
  if (result.success) {
    await historyStore.load()
    await projectStore.load()
  }
  return result
}
