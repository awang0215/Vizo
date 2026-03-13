import { useSyncExternalStore } from 'react'
import { historyStore } from '@/store/history-store'
import { projectStore } from '@/store/project-store'

export function useHistoryStore() {
  const selectedProjectId = useSyncExternalStore(
    projectStore.subscribe,
    () => projectStore.getSelectedProjectId(),
    () => projectStore.getSelectedProjectId()
  )

  const records = useSyncExternalStore(
    historyStore.subscribe,
    () => historyStore.getRecordsByProject(selectedProjectId ?? ''),
    () => historyStore.getRecordsByProject(selectedProjectId ?? '')
  )

  return { records }
}
