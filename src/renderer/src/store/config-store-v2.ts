import type { Config, ModelId, PersistedState } from '@/types/config'
import { generateId } from '@/utils/id'

const DEFAULT_STATE: PersistedState = {
  configs: [],
  selectedConfigId: null,
  selectedModel: 'nano-banana-pro'
}

function normalizeVerifyStatus(status: unknown): Config['verifyStatus'] {
  if (status === 'verifying' || status === 'success' || status === 'error') {
    return status
  }
  return 'idle'
}

function normalizeConfig(config: Partial<Config> & { id: string; name: string }): Config {
  return {
    id: config.id,
    name: config.name,
    apiKey: config.apiKey ?? '',
    url: config.url ?? '',
    proModelNameOverride: config.proModelNameOverride ?? '',
    flashModelNameOverride: config.flashModelNameOverride ?? '',
    lastVerifiedAt: config.lastVerifiedAt ?? null,
    verifyStatus: normalizeVerifyStatus(config.verifyStatus)
  }
}

function normalizeState(raw: PersistedState | null): PersistedState {
  const configs = (raw?.configs ?? []).map((config) =>
    normalizeConfig({
      ...config,
      id: config.id || generateId(),
      name: config.name || '配置'
    })
  )

  let selectedConfigId = raw?.selectedConfigId ?? null
  if (selectedConfigId && !configs.some((config) => config.id === selectedConfigId)) {
    selectedConfigId = null
  }
  if (!selectedConfigId && configs.length > 0) {
    selectedConfigId = configs[0].id
  }

  return {
    configs,
    selectedConfigId,
    selectedModel:
      raw?.selectedModel === 'nano-banana-2' ? 'nano-banana-2' : 'nano-banana-pro'
  }
}

async function loadFromStorage(): Promise<PersistedState> {
  if (typeof window?.electronAPI?.loadConfig !== 'function') {
    return { ...DEFAULT_STATE }
  }

  const raw = await window.electronAPI.loadConfig()
  return normalizeState(raw)
}

function saveToStorage(nextState: PersistedState): void {
  if (typeof window?.electronAPI?.saveConfig !== 'function') return

  window.electronAPI.saveConfig(nextState).catch((error) => {
    console.error('Failed to save config:', error)
  })
}

let state: PersistedState = { ...DEFAULT_STATE }

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export const configStoreV2 = {
  getState(): PersistedState {
    return state
  },

  getSelectedConfig(): Config | null {
    return state.configs.find((config) => config.id === state.selectedConfigId) ?? null
  },

  async load(): Promise<void> {
    state = await loadFromStorage()
    notify()
  },

  setSelectedModel(model: ModelId): void {
    state = { ...state, selectedModel: model }
    saveToStorage(state)
    notify()
  },

  setSelectedConfig(id: string | null): void {
    if (id && !state.configs.some((config) => config.id === id)) return

    state = { ...state, selectedConfigId: id }
    saveToStorage(state)
    notify()
  },

  updateConfig(id: string, patch: Partial<Config>): void {
    if (!state.configs.some((config) => config.id === id)) return

    state = {
      ...state,
      configs: state.configs.map((config) =>
        config.id === id ? { ...config, ...patch } : config
      )
    }
    saveToStorage(state)
    notify()
  },

  getNextDefaultConfigName(): string {
    const usedNames = new Set(state.configs.map((config) => config.name))
    let index = 1
    while (usedNames.has(`配置${index}`)) {
      index += 1
    }
    return `配置${index}`
  },

  addConfig(config: Omit<Config, 'id'>): Config {
    const nextConfig: Config = {
      ...config,
      id: generateId(),
      proModelNameOverride: config.proModelNameOverride ?? '',
      flashModelNameOverride: config.flashModelNameOverride ?? '',
      lastVerifiedAt: config.lastVerifiedAt ?? null,
      verifyStatus: config.verifyStatus ?? 'idle'
    }

    state = {
      ...state,
      configs: [...state.configs, nextConfig],
      selectedConfigId: nextConfig.id
    }
    saveToStorage(state)
    notify()
    return nextConfig
  },

  deleteConfig(id: string): void {
    if (!state.configs.some((config) => config.id === id)) return

    const nextConfigs = state.configs.filter((config) => config.id !== id)
    const nextSelectedConfigId =
      state.selectedConfigId === id ? nextConfigs[0]?.id ?? null : state.selectedConfigId

    state = {
      ...state,
      configs: nextConfigs,
      selectedConfigId: nextSelectedConfigId
    }
    saveToStorage(state)
    notify()
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }
}
