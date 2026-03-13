import { useSyncExternalStore } from 'react'
import { configStoreV2 } from '@/store/config-store-v2'

function subscribe(listener: () => void) {
  return configStoreV2.subscribe(listener)
}

function getSnapshot() {
  return configStoreV2.getState()
}

export function useConfigStoreV2() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return {
    configs: state.configs,
    selectedConfigId: state.selectedConfigId,
    selectedModel: state.selectedModel,
    selectedConfig:
      state.configs.find((config) => config.id === state.selectedConfigId) ?? null,
    setSelectedModel: configStoreV2.setSelectedModel,
    setSelectedConfig: configStoreV2.setSelectedConfig,
    updateConfig: configStoreV2.updateConfig,
    addConfig: configStoreV2.addConfig,
    deleteConfig: configStoreV2.deleteConfig
  }
}
