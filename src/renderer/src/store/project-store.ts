import type { Project } from '@/types/project'

let projects: Project[] = []
let selectedProjectId: string | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

async function loadFromMain() {
  if (typeof window?.electronAPI?.loadProjects !== 'function') return
  const state = await window.electronAPI.loadProjects()
  projects = state.projects ?? []
  selectedProjectId = state.selectedProjectId ?? null
  if (selectedProjectId && !projects.some((project) => project.id === selectedProjectId)) {
    selectedProjectId = projects[0]?.id ?? null
  }
}

async function saveToMain() {
  if (typeof window?.electronAPI?.saveProjects !== 'function') return
  await window.electronAPI.saveProjects({ projects, selectedProjectId })
}

export const projectStore = {
  async load(): Promise<void> {
    await loadFromMain()
    notify()
  },

  getProjects(): Project[] {
    return projects
  },

  getSelectedProjectId(): string | null {
    return selectedProjectId
  },

  getSelectedProject(): Project | null {
    return projects.find((p) => p.id === selectedProjectId) ?? null
  },

  getProject(id: string): Project | null {
    return projects.find((p) => p.id === id) ?? null
  },

  setProjectsAndSelected(projectsList: Project[], selected: string | null) {
    projects = projectsList
    selectedProjectId = selected
    saveToMain().catch(console.error)
    notify()
  },

  setSelectedProject(id: string | null) {
    if (id && !projects.some((p) => p.id === id)) return
    selectedProjectId = id
    saveToMain().catch(console.error)
    notify()
  },

  addProject(project: Project) {
    projects = [...projects, project]
    selectedProjectId = project.id
    saveToMain().catch(console.error)
    notify()
  },

  removeProject(id: string, newSelectedId: string | null) {
    projects = projects.filter((p) => p.id !== id)
    selectedProjectId = newSelectedId
    saveToMain().catch(console.error)
    notify()
  },

  updateProject(id: string, patch: Partial<Project>) {
    const idx = projects.findIndex((p) => p.id === id)
    if (idx === -1) return
    projects = projects.map((p) => (p.id === id ? { ...p, ...patch } : p))
    saveToMain().catch(console.error)
    notify()
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
}
