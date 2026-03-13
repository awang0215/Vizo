import { useSyncExternalStore } from 'react'
import { configStore } from '@/store/config-store'

function subscribe(fn: () => void) {
  return configStore.subscribe(fn)
}

function getSnapshot() {
  return configStore.getState()
}

/** 订阅配置 store 的 React hook */
export function useConfigStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    configs: state.configs,
    selectedConfigId: state.selectedConfigId,
    selectedModel: state.selectedModel,
    selectedConfig: state.configs.find((c) => c.id === state.selectedConfigId) ?? null,
    setSelectedModel: configStore.setSelectedModel,
    setSelectedConfig: configStore.setSelectedConfig,
    updateConfig: configStore.updateConfig,
    addConfig: configStore.addConfig,
    deleteConfig: configStore.deleteConfig
  }
}
