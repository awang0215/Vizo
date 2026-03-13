import { dialog, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { loadHistory, saveHistory } from '../storage/history-storage'
import { loadInputDirConfig, saveInputDirConfig } from '../storage/input-dir-config'
import { loadOutputDirConfig, saveOutputDirConfig } from '../storage/output-dir-config'
import { loadProjects, saveProjects } from '../storage/project-storage'
import { writeUninstallPaths } from './uninstall-paths-writer'

export async function getOutputDir(): Promise<string> {
  return loadOutputDirConfig()
}

export async function openOutputDir(): Promise<{ success: boolean; error?: string }> {
  try {
    const root = await getOutputDir()
    const directory = join(root, 'output')
    if (!existsSync(directory)) {
      await mkdir(directory, { recursive: true })
    }

    await shell.openPath(directory)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function pickOutputDir(): Promise<{ path?: string; canceled: boolean }> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: '选择输出目录'
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
  if (!existsSync(src)) {
    return
  }

  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath)
      continue
    }

    await mkdir(dirname(destPath), { recursive: true })
    await copyFile(srcPath, destPath)
  }
}

function rewritePathPrefix(filePath: string, fromDir: string, toDir: string): string {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const normalizedFromDir = fromDir.replace(/\\/g, '/')

  if (
    normalizedPath !== normalizedFromDir &&
    !normalizedPath.startsWith(`${normalizedFromDir}/`)
  ) {
    return filePath
  }

  const relativePath = normalizedPath.slice(normalizedFromDir.length).replace(/^\//, '')
  return relativePath ? join(toDir, relativePath) : toDir
}

function createUniquePath(directory: string, filename: string): string {
  const extension = filename.includes('.') ? `.${filename.split('.').pop()}` : ''
  const baseName = extension ? filename.slice(0, -extension.length) : filename
  let candidate = join(directory, filename)
  let index = 1

  while (existsSync(candidate)) {
    candidate = join(directory, `${baseName}-${index}${extension}`)
    index += 1
  }

  return candidate
}

async function migrateLegacyProjectDirs(
  legacyRoot: string,
  targetRoot: string
): Promise<Map<string, string>> {
  const outputDir = join(targetRoot, 'output')
  const inputDir = join(targetRoot, 'input')
  const pathMap = new Map<string, string>()

  await mkdir(outputDir, { recursive: true })
  await mkdir(inputDir, { recursive: true })

  const entries = await readdir(legacyRoot, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'input' || entry.name === 'output') {
      continue
    }

    const projectDir = join(legacyRoot, entry.name)
    const projectEntries = await readdir(projectDir, { withFileTypes: true })

    for (const projectEntry of projectEntries) {
      const sourcePath = join(projectDir, projectEntry.name)

      if (projectEntry.isDirectory() && projectEntry.name === 'input') {
        const inputEntries = await readdir(sourcePath, { withFileTypes: true })
        for (const inputEntry of inputEntries) {
          if (!inputEntry.isFile()) continue

          const inputSourcePath = join(sourcePath, inputEntry.name)
          const inputTargetPath = createUniquePath(inputDir, inputEntry.name)
          await copyFile(inputSourcePath, inputTargetPath)
          pathMap.set(inputSourcePath.replace(/\\/g, '/'), inputTargetPath)
        }
        continue
      }

      if (!projectEntry.isFile()) {
        continue
      }

      const outputTargetPath = createUniquePath(outputDir, projectEntry.name)
      await copyFile(sourcePath, outputTargetPath)
      pathMap.set(sourcePath.replace(/\\/g, '/'), outputTargetPath)
    }
  }

  return pathMap
}

function rewriteWithMap(filePath: string, pathMap: Map<string, string>): string {
  return pathMap.get(filePath.replace(/\\/g, '/')) ?? filePath
}

export async function migrateFromLegacyDir(
  oldDir: string,
  newDir: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!existsSync(newDir)) {
      await mkdir(newDir, { recursive: true })
    }

    const writable = await checkDirWritable(newDir)
    if (!writable) {
      return { success: false, error: '所选目录不可写，请选择其它目录' }
    }

    const [historyState, projectsState] = await Promise.all([loadHistory(), loadProjects()])
    const pathMap = await migrateLegacyProjectDirs(oldDir, newDir)

    for (const record of historyState.records) {
      record.inputImages = record.inputImages.map((image) => ({
        ...image,
        path: rewriteWithMap(image.path, pathMap)
      }))
      record.outputImages = record.outputImages.map((image) => ({
        ...image,
        path: rewriteWithMap(image.path, pathMap)
      }))
    }

    for (const project of projectsState.projects) {
      if (!project.previewImagePath) continue
      project.previewImagePath = rewriteWithMap(project.previewImagePath, pathMap)
    }

    await Promise.all([
      saveOutputDirConfig(newDir),
      saveInputDirConfig(join(newDir, 'input')),
      saveHistory(historyState),
      saveProjects(projectsState)
    ])
    await writeUninstallPaths()

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

export async function migrateOldStructureIfNeeded(): Promise<void> {
  try {
    const root = await loadOutputDirConfig()
    const outputDir = join(root, 'output')
    if (existsSync(outputDir)) {
      return
    }

    const entries = await readdir(root, { withFileTypes: true })
    const hasLegacyProjectDirs = entries.some(
      (entry) => entry.isDirectory() && entry.name !== 'input' && entry.name !== 'output'
    )

    if (!hasLegacyProjectDirs) {
      return
    }

    const result = await migrateFromLegacyDir(root, root)
    if (!result.success) {
      console.error('Structure migration failed:', result.error)
    }
  } catch (err) {
    console.error('Structure migration error:', err)
  }
}

export async function changeOutputDir(newDir: string): Promise<{ success: boolean; error?: string }> {
  const oldRoot = await getOutputDir()
  const normalizedOldRoot = oldRoot.replace(/\\/g, '/')
  const normalizedNewRoot = newDir.replace(/\\/g, '/')

  if (normalizedOldRoot === normalizedNewRoot) {
    return { success: true }
  }

  try {
    if (!existsSync(newDir)) {
      await mkdir(newDir, { recursive: true })
    }

    const writable = await checkDirWritable(newDir)
    if (!writable) {
      return { success: false, error: '所选目录不可写，请选择其它目录' }
    }

    const oldOutputDir = join(oldRoot, 'output')
    const newOutputDir = join(newDir, 'output')
    await copyDirRecursive(oldOutputDir, newOutputDir)

    const currentInputDir = await loadInputDirConfig()
    const oldDefaultInputDir = join(oldRoot, 'input')
    const newDefaultInputDir = join(newDir, 'input')
    const shouldMoveDefaultInput =
      currentInputDir.replace(/\\/g, '/') === oldDefaultInputDir.replace(/\\/g, '/')

    if (shouldMoveDefaultInput) {
      await copyDirRecursive(currentInputDir, newDefaultInputDir)
    }

    const [historyState, projectsState] = await Promise.all([loadHistory(), loadProjects()])
    for (const record of historyState.records) {
      record.outputImages = record.outputImages.map((image) => ({
        ...image,
        path: rewritePathPrefix(image.path, oldOutputDir, newOutputDir)
      }))

      record.inputImages = record.inputImages.map((image) => ({
        ...image,
        path: shouldMoveDefaultInput
          ? rewritePathPrefix(image.path, oldDefaultInputDir, newDefaultInputDir)
          : image.path
      }))
    }

    for (const project of projectsState.projects) {
      if (!project.previewImagePath) continue
      project.previewImagePath = rewritePathPrefix(project.previewImagePath, oldOutputDir, newOutputDir)
    }

    await saveOutputDirConfig(newDir)
    if (shouldMoveDefaultInput) {
      await saveInputDirConfig(newDefaultInputDir)
    }

    await Promise.all([saveHistory(historyState), saveProjects(projectsState)])
    await writeUninstallPaths()

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}
