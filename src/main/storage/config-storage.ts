import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { join } from 'node:path'

const CONFIG_FILENAME = 'config.json'

function getConfigPath(): string {
  return join(app.getPath('userData'), CONFIG_FILENAME)
}

export interface PersistedState {
  configs: Array<{
    id: string
    name: string
    apiKey: string
    url: string
    proModelNameOverride?: string
    flashModelNameOverride?: string
    lastVerifiedAt: string | null
    verifyStatus: string
  }>
  selectedConfigId: string | null
  selectedModel: string
}

/**
 * �ӱ��������ļ���������
 */
export async function loadConfig(): Promise<PersistedState | null> {
  try {
    const path = getConfigPath()
    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // �ļ������ڻ����ʧ��
  }
  return null
}

/**
 * �������õ����������ļ�
 */
export async function saveConfig(state: PersistedState): Promise<void> {
  try {
    const path = getConfigPath()
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(state, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save config:', err)
    throw err
  }
}
