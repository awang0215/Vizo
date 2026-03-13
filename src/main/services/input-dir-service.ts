import { dialog, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { loadHistory, saveHistory } from '../storage/history-storage'
import { loadInputDirConfig, saveInputDirConfig } from '../storage/input-dir-config'
import { writeUninstallPaths } from './uninstall-paths-writer'

export async function getInputDir(): Promise<string> {
  return loadInputDirConfig()
}

export async function openInputDir(): Promise<{ success: boolean; error?: string }> {
  try {
    const dir = await getInputDir()
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
    await shell.openPath(dir)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function pickInputDir(): Promise<{ path?: string; canceled: boolean }> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择输入目录'
  })

  if (result.canceled || !result.filePaths[0]) {
    return { canceled: true }
  }

  return { path: result.filePaths[0], canceled: false }
}

async function checkDirWritable(dir: string): Promise<boolean> {
  try {
    const testFile = join(dir, '.vizo-write-test')
    await writeFile(testFile, '')
    const { unlink } = await import('node:fs/promises')
    await unlink(testFile)
    return true
  } catch {
    return false
  }
}

async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath)
    } else {
      await mkdir(dirname(destPath), { recursive: true })
      await copyFile(srcPath, destPath)
    }
  }
}

export async function changeInputDir(newDir: string): Promise<{ success: boolean; error?: string }> {
  const oldDir = await getInputDir()
  const normalizedOld = oldDir.replace(/\\/g, '/')
  const normalizedNew = newDir.replace(/\\/g, '/')

  if (normalizedOld === normalizedNew) {
    return { success: true }
  }

  try {
    if (!existsSync(newDir)) {
      await mkdir(newDir, { recursive: true })
    }

    const writable = await checkDirWritable(newDir)
    if (!writable) {
      return { success: false, error: '所选目录不可写，请选择其他目录' }
    }

    const historyState = await loadHistory()

    if (existsSync(oldDir)) {
      try {
        await copyDirRecursive(oldDir, newDir)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { success: false, error: `迁移输入图片失败：${message}` }
      }
    }

    for (const record of historyState.records) {
      for (const image of record.inputImages) {
        const imagePath = image.path.replace(/\\/g, '/')
        if (imagePath.startsWith(`${normalizedOld}/`) || imagePath === normalizedOld) {
          const relative = imagePath.slice(normalizedOld.length).replace(/^\//, '')
          image.path = join(newDir, relative)
        }
      }
    }

    await saveInputDirConfig(newDir)
    await saveHistory(historyState)
    await writeUninstallPaths()
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
