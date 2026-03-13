import { app } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { getDefaultOutputDir } from '../storage/output-dir-config'
import { migrateFromLegacyDir, migrateOldStructureIfNeeded } from './output-dir-service'

const LEGACY_OUT_DIR = 'out'

function getOutputDirConfigPath(): string {
  return join(app.getPath('userData'), 'output-dir.json')
}

/**
 * �״����ʱ������ھɰ� userData/out �����Ҵ�δ���ù����Ŀ¼��Ǩ�Ƶ�Ĭ�� Pictures/Vizo
 */
export async function runStartupMigration(): Promise<void> {
  try {
    const configPath = getOutputDirConfigPath()
    const hasOutputDirConfig = existsSync(configPath)

    const legacyDir = join(app.getPath('userData'), LEGACY_OUT_DIR)
    const hasLegacyData = existsSync(legacyDir)

    if (!hasOutputDirConfig && hasLegacyData) {
      const defaultDir = getDefaultOutputDir()
      const result = await migrateFromLegacyDir(legacyDir, defaultDir)
      if (!result.success) {
        console.error('Startup migration failed:', result.error)
      }
    }

    await migrateOldStructureIfNeeded()
  } catch (err) {
    console.error('Startup migration error:', err)
  }
}
