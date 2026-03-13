import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const FILENAME = 'proxy-config.json'

function getPath(): string {
  return join(app.getPath('userData'), FILENAME)
}

export type ProxyMode = 'none' | 'system' | 'manual'

export interface ProxyConfig {
  proxyMode: ProxyMode
  proxyHost: string
  proxyPort: string
}

const DEFAULT: ProxyConfig = {
  proxyMode: 'system',
  proxyHost: '',
  proxyPort: ''
}

export async function loadProxyConfig(): Promise<ProxyConfig> {
  try {
    const path = getPath()
    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ProxyConfig>
    if (parsed && typeof parsed === 'object') {
      return {
        proxyMode: parsed.proxyMode ?? DEFAULT.proxyMode,
        proxyHost: typeof parsed.proxyHost === 'string' ? parsed.proxyHost : DEFAULT.proxyHost,
        proxyPort: typeof parsed.proxyPort === 'string' ? parsed.proxyPort : DEFAULT.proxyPort
      }
    }
  } catch {
    // �ļ������ڻ����ʧ��
  }
  return { ...DEFAULT }
}

export async function saveProxyConfig(config: ProxyConfig): Promise<void> {
  const path = getPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(config, null, 2), 'utf-8')
}
