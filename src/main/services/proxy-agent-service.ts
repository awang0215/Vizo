import { HttpsProxyAgent } from 'https-proxy-agent'
import type { Agent } from 'node:http'
import { session } from 'electron'
import { loadProxyConfig } from '../storage/proxy-config-storage'

/**
 * 解析 resolveProxy 返回的字符串
 * 格式如 "PROXY 127.0.0.1:7890"、"HTTPS 127.0.0.1:7890" 或 "DIRECT"
 */
function parseProxyResult(result: string): string | null {
  const s = (result || '').trim()
  if (!s || s.toUpperCase() === 'DIRECT') return null
  const match = s.match(/(?:PROXY|HTTPS|HTTP)\s+([^\s;]+)/i)
  if (!match) return null
  const hostPort = match[1].trim()
  if (!hostPort) return null
  return hostPort.startsWith('http') ? hostPort : `http://${hostPort}`
}

/**
 * 获取用于 HTTPS 请求的代理 Agent
 * 供 verify-service 和 google-generative-adapter 使用
 */
export async function getProxyAgent(): Promise<Agent | undefined> {
  const config = await loadProxyConfig()

  if (config.proxyMode === 'none') {
    return undefined
  }

  if (config.proxyMode === 'manual') {
    const host = config.proxyHost?.trim()
    const port = config.proxyPort?.trim()
    if (!host || !port) return undefined
    const proxyUrl = `http://${host}:${port}`
    return new HttpsProxyAgent(proxyUrl) as unknown as Agent
  }

  if (config.proxyMode === 'system') {
    try {
      const result = await session.defaultSession.resolveProxy(
        'https://generativelanguage.googleapis.com'
      )
      const proxyUrl = parseProxyResult(result)
      if (!proxyUrl) return undefined
      return new HttpsProxyAgent(proxyUrl) as unknown as Agent
    } catch {
      return undefined
    }
  }

  return undefined
}
