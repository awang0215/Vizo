import { session } from 'electron'
import { autoUpdater } from 'electron-updater'
import {
  loadProxyConfig,
  saveProxyConfig,
  type ProxyConfig,
  type ProxyMode
} from '../storage/proxy-config-storage'

function buildProxyConfig(config: ProxyConfig): Electron.ProxyConfig {
  const mode: ProxyMode = config.proxyMode ?? 'system'

  if (mode === 'none') {
    return {
      mode: 'direct'
    }
  }

  if (mode === 'manual') {
    const host = config.proxyHost.trim()
    const port = config.proxyPort.trim()

    if (!host || !port) {
      return {
        mode: 'direct'
      }
    }

    return {
      mode: 'fixed_servers',
      proxyRules: `http=${host}:${port};https=${host}:${port}`
    }
  }

  return {
    mode: 'system'
  }
}

async function applyProxyConfig(config: ProxyConfig): Promise<void> {
  const nextConfig = buildProxyConfig(config)

  await Promise.all([
    session.defaultSession.setProxy(nextConfig),
    autoUpdater.netSession.setProxy(nextConfig)
  ])

  await Promise.all([
    session.defaultSession.forceReloadProxyConfig(),
    autoUpdater.netSession.forceReloadProxyConfig()
  ])

  await Promise.all([
    session.defaultSession.closeAllConnections(),
    autoUpdater.netSession.closeAllConnections()
  ])
}

export async function applySavedProxyConfig(): Promise<void> {
  const config = await loadProxyConfig()
  await applyProxyConfig(config)
}

export async function saveAndApplyProxyConfig(config: ProxyConfig): Promise<void> {
  await saveProxyConfig(config)
  await applyProxyConfig(config)
}
