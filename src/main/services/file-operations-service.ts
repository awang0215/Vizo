import { dialog, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile } from 'node:fs/promises'
import { basename } from 'node:path'

export async function showItemInFolder(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!existsSync(filePath)) {
      return { success: false, error: '文件不存在' }
    }

    shell.showItemInFolder(filePath)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function saveFileAs(
  sourcePath: string,
  defaultName?: string
): Promise<{ success: boolean; savedPath?: string; error?: string }> {
  try {
    if (!existsSync(sourcePath)) {
      return { success: false, error: '源文件不存在' }
    }

    const ext = sourcePath.split('.').pop()?.toLowerCase() ?? 'png'
    const name = defaultName ?? basename(sourcePath)

    const result = await dialog.showSaveDialog({
      title: '另存为',
      defaultPath: name,
      filters: [{ name: '图片', extensions: [ext] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: '已取消' }
    }

    await copyFile(sourcePath, result.filePath)
    return { success: true, savedPath: result.filePath }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
