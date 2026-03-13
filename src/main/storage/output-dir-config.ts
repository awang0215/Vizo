import { app } from 'electron'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const FILENAME = 'output-dir.json'

function getConfigPath(): string {
  return join(app.getPath('userData'), FILENAME)
}

/**
 * ��ȡĬ�ϸ�Ŀ¼���û�ͼƬĿ¼�µ� Vizo
 * ʵ������� root/output�������� root/input
 */
export function getDefaultOutputDir(): string {
  return join(app.getPath('pictures'), 'Vizo')
}

export interface OutputDirConfig {
  outputDir: string
}

/**
 * ���������Ŀ¼���ã�ͼƬ/Vizo��
 * ʵ������ļ��� root/output/projectId/�������� root/input/projectId/
 * δ����ʱ����Ĭ�ϣ�ͼƬ/Vizo��
 */
export async function loadOutputDirConfig(): Promise<string> {
  try {
    const path = getConfigPath()
    const raw = await readFile(path, 'utf-8')
    const parsed = JSON.parse(raw) as OutputDirConfig
    if (parsed?.outputDir && typeof parsed.outputDir === 'string') {
      return parsed.outputDir
    }
  } catch {
    // �ļ������ڻ����ʧ��
  }
  return getDefaultOutputDir()
}

/**
 * �������Ŀ¼����
 */
export async function saveOutputDirConfig(outputDir: string): Promise<void> {
  const path = getConfigPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify({ outputDir }, null, 2), 'utf-8')
}
