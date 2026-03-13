import { useSyncExternalStore } from 'react'
import { projectStore } from '@/store/project-store'

export function useProjectStore() {
  const projects = useSyncExternalStore(
    projectStore.subscribe,
    () => projectStore.getProjects(),
    () => projectStore.getProjects()
  )

  const selectedProjectId = useSyncExternalStore(
    projectStore.subscribe,
    () => projectStore.getSelectedProjectId(),
    () => projectStore.getSelectedProjectId()
  )

  const selectedProject = useSyncExternalStore(
    projectStore.subscribe,
    () => projectStore.getSelectedProject(),
    () => projectStore.getSelectedProject()
  )

  return {
    projects,
    selectedProjectId,
    selectedProject
  }
}
