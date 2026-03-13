import https from 'node:https'
import http from 'node:http'
import type { Agent } from 'node:http'
import { URL } from 'node:url'
import { resolveModelName } from './model-resolver'
import { DEFAULT_OFFICIAL_BASE_URL } from '../../constants/api'
import { getProxyAgent } from '../proxy-agent-service'
import type { ModelId } from './model-resolver'

export interface GenerateParams {
  modelId: ModelId
  apiKey: string
  baseUrl: string
  proModelOverride: string
  flashModelOverride: string
  promptText: string
  inputImagesBase64: Array<{ mimeType: string; base64: string }>
  resolutionPreset: string
  outputCount: number
  aspectRatio: string
}

export interface GeneratedImage {
  mimeType: string
  base64: string
}

export interface GenerateResult {
  success: boolean
  images?: GeneratedImage[]
  error?: string
}

/**
 * Google Generative Language API ������
 * ֧�ֹٷ�Ĭ�ϵ�ַ���Զ������ URL
 */
export async function generateWithGoogleAdapter(
  params: GenerateParams
): Promise<GenerateResult> {
  const modelName = resolveModelName(
    params.modelId,
    params.proModelOverride,
    params.flashModelOverride
  )

  const baseUrl = (params.baseUrl?.trim() || DEFAULT_OFFICIAL_BASE_URL).replace(
    /\/$/,
    ''
  )
  const endpoint = `${baseUrl}/v1beta/models/${modelName}:generateContent`

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

  for (const img of params.inputImagesBase64) {
    parts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64
      }
    })
  }

  parts.push({ text: params.promptText })

  // Gemini ͼ�����ɽӿ�֧�� generationConfig.imageConfig
  // aspectRatio: 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9, 21:9
  // imageSize: 1K, 2K, 4K���� aspectRatio ��Ͼ�������ߴ磬�� 2K+16:9=2752*1536��
  const generationConfig: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: params.aspectRatio || '1:1',
      imageSize: params.resolutionPreset || '2K'
    }
  }
  const body = JSON.stringify({
    contents: [{ role: 'user', parts }],
    generationConfig
  })

  try {
    const agent = await getProxyAgent()
    const res = await httpPost(endpoint, body, {
      'Content-Type': 'application/json',
      'x-goog-api-key': params.apiKey
    }, agent)

    const data = JSON.parse(res) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { mimeType?: string; data?: string }
          }>
        }
      }>
      error?: { message?: string }
    }

    if (data.error) {
      return {
        success: false,
        error: data.error.message ?? 'API ���ش���'
      }
    }

    const images: GeneratedImage[] = []
    for (const c of data.candidates ?? []) {
      for (const p of c.content?.parts ?? []) {
        if (p.inlineData?.data) {
          images.push({
            mimeType: p.inlineData.mimeType ?? 'image/png',
            base64: p.inlineData.data
          })
        }
      }
    }

    return { success: true, images }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

function httpPost(
  url: string,
  body: string,
  headers: Record<string, string>,
  agent?: Agent
): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const isHttps = u.protocol === 'https:'
    const lib = isHttps ? https : http
    const options: Record<string, unknown> = {
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Length': String(Buffer.byteLength(body, 'utf-8'))
      }
    }
    if (agent && isHttps) {
      options.agent = agent
    }
    const req = lib.request(options,
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf-8')
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(text)
          } else {
            let errMsg = `HTTP ${res.statusCode}`
            try {
              const parsed = JSON.parse(text) as { error?: { message?: string } }
              if (parsed?.error?.message) {
                errMsg = parsed.error.message
              } else {
                errMsg = text ? `${errMsg}: ${text.slice(0, 200)}` : errMsg
              }
            } catch {
              if (text) errMsg = `${errMsg}: ${text.slice(0, 200)}`
            }
            reject(new Error(errMsg))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body, 'utf-8')
    req.end()
  })
}
