import https from 'node:https'
import { URL } from 'node:url'
import { DEFAULT_OFFICIAL_BASE_URL } from '../constants/api'
import { getProxyAgent } from './proxy-agent-service'

export interface VerifyParams {
  apiKey: string
  url?: string
}

export interface VerifyResult {
  success: boolean
  message: string
}

async function httpsGet(
  url: string,
  headers: Record<string, string>
): Promise<{ statusCode: number; statusMessage: string }> {
  const agent = await getProxyAgent()

  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const request = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: target.pathname + target.search,
        method: 'GET',
        headers,
        timeout: 10000,
        ...(agent && { agent })
      },
      (response) => {
        resolve({
          statusCode: response.statusCode ?? 0,
          statusMessage: response.statusMessage ?? ''
        })
      }
    )

    request.on('error', reject)
    request.on('timeout', () => {
      request.destroy()
      reject(new Error('连接超时'))
    })
    request.end()
  })
}

export async function verifyConnection(params: VerifyParams): Promise<VerifyResult> {
  const { apiKey, url } = params

  if (!apiKey?.trim()) {
    return { success: false, message: 'API Key 不能为空' }
  }

  const baseUrl = (url?.trim() || DEFAULT_OFFICIAL_BASE_URL).replace(/\/$/, '')
  const isOfficial = !url?.trim()
  const verifyPath = isOfficial ? '/v1beta/models?pageSize=1' : '/health'
  const verifyUrl = `${baseUrl}${verifyPath}`

  const headers: Record<string, string> = isOfficial
    ? { 'x-goog-api-key': apiKey }
    : { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }

  try {
    const { statusCode } = await httpsGet(verifyUrl, headers)

    if (statusCode >= 200 && statusCode < 300) {
      return { success: true, message: '连接成功' }
    }

    if (statusCode === 401) {
      return { success: false, message: 'API Key 无效或已过期' }
    }

    return { success: false, message: `连接失败：${statusCode}` }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('超时')) {
      return { success: false, message: '连接超时' }
    }
    return { success: false, message: `连接失败：${message}` }
  }
}
