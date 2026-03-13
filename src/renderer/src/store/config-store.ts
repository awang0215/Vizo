import type { Config, ModelId, PersistedState } from '@/types/config'
import { generateId } from '@/utils/id'

const DEFAULT_CONFIGS: Config[] = [
  { id: 'c1', name: '����1', apiKey: '', url: '', proModelNameOverride: '', flashModelNameOverride: '', lastVerifiedAt: null, verifyStatus: 'idle' },
  { id: 'c2', name: '����2', apiKey: '', url: '', proModelNameOverride: '', flashModelNameOverride: '', lastVerifiedAt: null, verifyStatus: 'idle' },
  { id: 'c3', name: '����3', apiKey: '', url: '', proModelNameOverride: '', flashModelNameOverride: '', lastVerifiedAt: null, verifyStatus: 'idle' }
]

const DEFAULT_STATE: PersistedState = {
  configs: DEFAULT_CONFIGS,
  selectedConfigId: 'c1',
  selectedModel: 'nano-banana-pro'
}

function normalizeConfig(c: Partial<Config> & { id: string; name: string }): Config {
  return {
    id: c.id,
    name: c.name,
    apiKey: c.apiKey ?? '',
    url: c.url ?? '',
    proModelNameOverride: c.proModelNameOverride ?? '',
    flashModelNameOverride: c.flashModelNameOverride ?? '',
    lastVerifiedAt: c.lastVerifiedAt ?? null,
    verifyStatus: (c.verifyStatus as Config['verifyStatus']) ?? 'idle'
  }
}

function normalizeState(raw: PersistedState | null): PersistedState {
  if (!raw?.configs?.length) {
    return { ...DEFAULT_STATE }
  }
  const configs = raw.configs.map((c) =>
    normalizeConfig({ ...c, id: c.id || generateId(), name: c.name || '����' })
  )
  let selectedConfigId = raw.selectedConfigId
  if (!selectedConfigId || !configs.some((c) => c.id === selectedConfigId)) {
    selectedConfigId = configs[0].id
  }
  const selectedModel =
    raw.selectedModel === 'nano-banana-2' ? 'nano-banana-2' : 'nano-banana-pro'
  return { configs, selectedConfigId, selectedModel }
}

async function loadFromStorage(): Promise<PersistedState> {
  if (typeof window?.electronAPI?.loadConfig !== 'function') {
    return { ...DEFAULT_STATE }
  }
  const raw = await window.electronAPI.loadConfig()
  return normalizeState(raw)
}

function saveToStorage(state: PersistedState): void {
  if (typeof window?.electronAPI?.saveConfig !== 'function') return
  window.electronAPI.saveConfig(state).catch((err) => {
    console.error('Failed to save config:', err)
  })
}

let state: PersistedState = { ...DEFAULT_STATE }

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export const configStore = {
  getState(): PersistedState {
    return state
  },

  getConfigs(): Config[] {
    return state.configs
  },

  getSelectedConfig(): Config | null {
    return state.configs.find((c) => c.id === state.selectedConfigId) ?? null
  },

  getSelectedConfigId(): string | null {
    return state.selectedConfigId
  },

  getSelectedModel(): ModelId {
    return state.selectedModel
  },

  /** �������̼������ã����ʱ���� */
  async load(): Promise<void> {
    const loaded = await loadFromStorage()
    state = loaded
    notify()
  },

  setSelectedModel(model: ModelId): void {
    state = { ...state, selectedModel: model }
    saveToStorage(state)
    notify()
  },

  setSelectedConfig(id: string): void {
    if (!state.configs.some((c) => c.id === id)) return
    state = { ...state, selectedConfigId: id }
    saveToStorage(state)
    notify()
  },

  updateConfig(id: string, patch: Partial<Config>): void {
    const idx = state.configs.findIndex((c) => c.id === id)
    if (idx === -1) return
    state = {
      ...state,
      configs: state.configs.map((c) => (c.id === id ? { ...c, ...patch } : c))
    }
    saveToStorage(state)
    notify()
  },

  getNextDefaultConfigName(): string {
    const used = new Set(state.configs.map((c) => c.name))
    let n = 1
    while (used.has(`����${n}`)) n++
    return `����${n}`
  },

  addConfig(config: Omit<Config, 'id' | 'lastVerifiedAt' | 'verifyStatus'>): Config {
    const newConfig: Config = {
      ...config,
      proModelNameOverride: config.proModelNameOverride ?? '',
      flashModelNameOverride: config.flashModelNameOverride ?? '',
      id: generateId(),
      lastVerifiedAt: null,
      verifyStatus: 'idle'
    }
    state = {
      ...state,
      configs: [...state.configs, newConfig],
      selectedConfigId: newConfig.id
    }
    saveToStorage(state)
    notify()
    return newConfig
  },

  deleteConfig(id: string): void {
    const idx = state.configs.findIndex((c) => c.id === id)
    if (idx === -1) return
    const nextConfigs = state.configs.filter((c) => c.id !== id)
    if (nextConfigs.length === 0) return
    let nextSelectedId = state.selectedConfigId
    if (state.selectedConfigId === id) {
      nextSelectedId = nextConfigs[0]?.id ?? null
    }
    state = {
      ...state,
      configs: nextConfigs,
      selectedConfigId: nextSelectedId
    }
    saveToStorage(state)
    notify()
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
}
