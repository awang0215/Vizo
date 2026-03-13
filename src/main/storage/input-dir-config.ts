import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import { loadOutputDirConfig } from './output-dir-config'

const FILENAME = 'input-dir.json'

function getConfigPath(): string {
  return join(app.getPath('userData'), FILENAME)
}

export interface InputDirConfig {
  inputDir: string
}

/**
 * ��ȡĬ������Ŀ¼��root/input��root �������Ŀ¼���ã�
 */
export async function getDefaultInputDir(): Promise<string> {
  const root = await loadOutputDirConfig()
  return join(root, 'input')
}

/**
 * ��������Ŀ¼����
 * δ����ʱ����Ĭ�ϣ�root/input��root Ϊ��ǰ�����Ŀ¼��
 */
export async function loadInputDirConfig(): Promise<string> {
  try {
    const path = getConfigPath()
    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw) as InputDirConfig
    if (parsed?.inputDir && typeof parsed.inputDir === 'string') {
      return parsed.inputDir
    }
  } catch {
    // �ļ������ڻ����ʧ��
  }
  return getDefaultInputDir()
}

/**
 * ��������Ŀ¼����
 */
export async function saveInputDirConfig(inputDir: string): Promise<void> {
  const path = getConfigPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify({ inputDir }, null, 2), 'utf-8')
}
