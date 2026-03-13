import { app } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, normalize } from 'node:path'
import { loadInputDirConfig } from '../storage/input-dir-config'
import { loadOutputDirConfig } from '../storage/output-dir-config'

const FILENAME = 'vizo-delete-on-uninstall.txt'
const LEGACY_OUT_DIR = 'out'

function getPath(): string {
  return join(app.getPath('userData'), FILENAME)
}

function addPath(targets: Set<string>, value: string | null | undefined): void {
  const trimmed = value?.trim()
  if (!trimmed) return
  targets.add(normalize(trimmed))
}

/**
 * Persist the actual runtime-owned folders for the uninstall script.
 * This keeps uninstall cleanup aligned with the real write locations.
 */
export async function writeUninstallPaths(): Promise<void> {
  try {
    const [outputRoot, inputDir] = await Promise.all([
      loadOutputDirConfig(),
      loadInputDirConfig()
    ])

    const targets = new Set<string>()
    const userDataDir = app.getPath('userData')
    const defaultPicturesRoot = join(app.getPath('pictures'), 'Vizo')

    addPath(targets, userDataDir)
    addPath(targets, join(outputRoot, 'output'))
    addPath(targets, inputDir)

    addPath(targets, join(userDataDir, LEGACY_OUT_DIR))
    addPath(targets, join(userDataDir, LEGACY_OUT_DIR, 'output'))

    addPath(targets, join(defaultPicturesRoot, 'output'))
    addPath(targets, join(defaultPicturesRoot, 'input'))

    const path = getPath()
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, Array.from(targets).join('\n'), 'utf-8')
  } catch (err) {
    console.error('writeUninstallPaths failed:', err)
  }
}
