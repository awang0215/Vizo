import { nativeImage, type WebContents } from 'electron'
import { existsSync, watch, type FSWatcher } from 'node:fs'
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises'
import { basename, extname, join, normalize, parse, relative } from 'node:path'
import { pathToDisplayUrl } from '../storage/file-cache-service'
import { loadInputDirConfig } from '../storage/input-dir-config'
import { loadOutputDirConfig } from '../storage/output-dir-config'

export type LibraryScope = 'input' | 'output'

export interface LibraryImageItem {
  path: string
  name: string
  displayUrl: string
  relativePath: string
  modifiedAt: number
  createdAt: number
}

export interface LibraryListResult {
  success: boolean
  directory: string
  items: LibraryImageItem[]
  error?: string
}

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'])
const DRAG_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+X8UAAAAASUVORK5CYII='

const watchers = new Map<LibraryScope, FSWatcher>()
const watcherTimers = new Map<LibraryScope, NodeJS.Timeout>()

function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(extname(filePath).toLowerCase())
}

function normalizePath(filePath: string): string {
  return normalize(filePath).toLowerCase()
}

async function getLibraryDir(scope: LibraryScope): Promise<string> {
  if (scope === 'input') {
    return loadInputDirConfig()
  }

  const outputRoot = await loadOutputDirConfig()
  return join(outputRoot, 'output')
}

async function ensureLibraryDir(scope: LibraryScope): Promise<string> {
  const directory = await getLibraryDir(scope)
  await mkdir(directory, { recursive: true })
  return directory
}

async function collectLibraryImages(directory: string): Promise<LibraryImageItem[]> {
  const items: LibraryImageItem[] = []

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
        continue
      }

      if (!entry.isFile() || !isImageFile(entry.name)) {
        continue
      }

      const fileStat = await stat(fullPath)
      items.push({
        path: fullPath,
        name: entry.name,
        displayUrl: `${pathToDisplayUrl(fullPath)}?v=${Math.round(fileStat.mtimeMs)}`,
        relativePath: relative(directory, fullPath).replace(/\\/g, '/'),
        modifiedAt: fileStat.mtimeMs,
        createdAt: fileStat.birthtimeMs
      })
    }
  }

  if (!existsSync(directory)) {
    return items
  }

  await walk(directory)

  items.sort((left, right) => {
    const byName = right.name.localeCompare(left.name, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
    if (byName !== 0) return byName

    const byModifiedAt = right.modifiedAt - left.modifiedAt
    if (byModifiedAt !== 0) return byModifiedAt

    return right.createdAt - left.createdAt
  })

  return items
}

function createUniquePath(directory: string, originalName: string): string {
  const parsed = parse(originalName)
  let candidate = join(directory, originalName)
  let index = 1

  while (existsSync(candidate)) {
    candidate = join(directory, `${parsed.name}-${index}${parsed.ext}`)
    index += 1
  }

  return candidate
}

function emitLibraryChanged(webContents: WebContents, scope: LibraryScope): void {
  webContents.send('library:changed', {
    scope,
    occurredAt: Date.now()
  })
}

function scheduleLibraryChanged(webContents: WebContents, scope: LibraryScope): void {
  const existingTimer = watcherTimers.get(scope)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const timer = setTimeout(() => {
    watcherTimers.delete(scope)
    emitLibraryChanged(webContents, scope)
  }, 120)

  watcherTimers.set(scope, timer)
}

function stopWatcher(scope: LibraryScope): void {
  const watcher = watchers.get(scope)
  if (watcher) {
    watcher.close()
    watchers.delete(scope)
  }

  const timer = watcherTimers.get(scope)
  if (timer) {
    clearTimeout(timer)
    watcherTimers.delete(scope)
  }
}

export async function listLibraryImages(scope: LibraryScope): Promise<LibraryListResult> {
  let directory = ''

  try {
    directory = await ensureLibraryDir(scope)
    const items = await collectLibraryImages(directory)
    return {
      success: true,
      directory,
      items
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      directory,
      items: [],
      error: message
    }
  }
}

export async function importFilesToLibrary(
  scope: LibraryScope,
  sourcePaths: string[]
): Promise<{ success: boolean; imported: number; error?: string }> {
  try {
    const directory = await ensureLibraryDir(scope)
    const uniqueSourcePaths = Array.from(new Set(sourcePaths.filter(Boolean)))
    let imported = 0

    for (const sourcePath of uniqueSourcePaths) {
      if (!existsSync(sourcePath) || !isImageFile(sourcePath)) {
        continue
      }

      const targetPath = createUniquePath(directory, basename(sourcePath))
      if (normalizePath(targetPath) === normalizePath(sourcePath)) {
        continue
      }

      await copyFile(sourcePath, targetPath)
      imported += 1
    }

    return {
      success: true,
      imported
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      imported: 0,
      error: message
    }
  }
}

export async function startLibraryWatchers(webContents: WebContents): Promise<void> {
  const scopes: LibraryScope[] = ['input', 'output']

  for (const scope of scopes) {
    stopWatcher(scope)
    const directory = await ensureLibraryDir(scope)

    try {
      const watcher = watch(
        directory,
        { recursive: true },
        () => scheduleLibraryChanged(webContents, scope)
      )

      watcher.on('error', (err) => {
        console.error(`Library watcher error (${scope}):`, err)
        stopWatcher(scope)
        emitLibraryChanged(webContents, scope)
      })

      watchers.set(scope, watcher)
    } catch (err) {
      console.error(`Failed to start library watcher (${scope}):`, err)
      emitLibraryChanged(webContents, scope)
    }
  }
}

export function stopLibraryWatchers(): void {
  stopWatcher('input')
  stopWatcher('output')
}

export async function refreshLibraryWatchers(webContents: WebContents): Promise<void> {
  await startLibraryWatchers(webContents)
  emitLibraryChanged(webContents, 'input')
  emitLibraryChanged(webContents, 'output')
}

export function startLibraryFileDrag(webContents: WebContents, filePath: string): void {
  if (!filePath || !existsSync(filePath)) {
    return
  }

  const dragIcon = nativeImage.createFromPath(filePath)
  webContents.startDrag({
    file: filePath,
    icon: dragIcon.isEmpty() ? nativeImage.createFromDataURL(DRAG_ICON_DATA_URL) : dragIcon
  })
}
