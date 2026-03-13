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
  thumbnailUrl?: string
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
const THUMBNAIL_SIZE = 240
const THUMBNAIL_CONCURRENCY = 6
const DRAG_ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+X8UAAAAASUVORK5CYII='

const watchers = new Map<LibraryScope, FSWatcher>()
const watcherTimers = new Map<LibraryScope, NodeJS.Timeout>()
const thumbnailCache = new Map<string, string>()
const libraryCache = new Map<LibraryScope, LibraryListResult>()
const dirtyScopes = new Set<LibraryScope>(['input', 'output'])

function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(extname(filePath).toLowerCase())
}

function normalizePath(filePath: string): string {
  return normalize(filePath).toLowerCase()
}

function getThumbnailCacheKey(filePath: string, modifiedAt: number): string {
  return `${normalizePath(filePath)}:${Math.round(modifiedAt)}`
}

function markLibraryDirty(scope: LibraryScope): void {
  dirtyScopes.add(scope)
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

async function mapWithConcurrency<T, TResult>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<TResult>
): Promise<TResult[]> {
  if (values.length === 0) {
    return []
  }

  const results = new Array<TResult>(values.length)
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex
      nextIndex += 1

      if (currentIndex >= values.length) {
        return
      }

      results[currentIndex] = await mapper(values[currentIndex])
    }
  }

  const workerCount = Math.min(concurrency, values.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

async function collectImagePaths(directory: string): Promise<string[]> {
  const paths: string[] = []

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true })

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(currentDir, entry.name)

        if (entry.isDirectory()) {
          await walk(fullPath)
          return
        }

        if (entry.isFile() && isImageFile(entry.name)) {
          paths.push(fullPath)
        }
      })
    )
  }

  if (!existsSync(directory)) {
    return paths
  }

  await walk(directory)
  return paths
}

async function createThumbnailUrl(filePath: string, modifiedAt: number): Promise<string | undefined> {
  const cacheKey = getThumbnailCacheKey(filePath, modifiedAt)
  const cachedThumbnail = thumbnailCache.get(cacheKey)
  if (cachedThumbnail) {
    return cachedThumbnail
  }

  try {
    const thumbnail = await nativeImage.createThumbnailFromPath(filePath, {
      width: THUMBNAIL_SIZE,
      height: THUMBNAIL_SIZE
    })

    if (thumbnail.isEmpty()) {
      return undefined
    }

    const thumbnailUrl = thumbnail.toDataURL()
    thumbnailCache.set(cacheKey, thumbnailUrl)
    return thumbnailUrl
  } catch {
    return undefined
  }
}

async function collectLibraryImages(directory: string): Promise<LibraryImageItem[]> {
  const imagePaths = await collectImagePaths(directory)
  const items = await mapWithConcurrency(imagePaths, THUMBNAIL_CONCURRENCY, async (fullPath) => {
    const fileStat = await stat(fullPath)
    return {
      path: fullPath,
      name: basename(fullPath),
      displayUrl: `${pathToDisplayUrl(fullPath)}?v=${Math.round(fileStat.mtimeMs)}`,
      thumbnailUrl: await createThumbnailUrl(fullPath, fileStat.mtimeMs),
      relativePath: relative(directory, fullPath).replace(/\\/g, '/'),
      modifiedAt: fileStat.mtimeMs,
      createdAt: fileStat.birthtimeMs
    }
  })

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
  markLibraryDirty(scope)
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

export async function listLibraryImages(
  scope: LibraryScope,
  options?: { force?: boolean }
): Promise<LibraryListResult> {
  let directory = ''

  try {
    directory = await ensureLibraryDir(scope)
    const cachedResult = libraryCache.get(scope)
    if (!options?.force && cachedResult && cachedResult.directory === directory && !dirtyScopes.has(scope)) {
      return cachedResult
    }

    const items = await collectLibraryImages(directory)
    const result: LibraryListResult = {
      success: true,
      directory,
      items
    }

    libraryCache.set(scope, result)
    dirtyScopes.delete(scope)
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const result: LibraryListResult = {
      success: false,
      directory,
      items: [],
      error: message
    }

    libraryCache.set(scope, result)
    dirtyScopes.delete(scope)
    return result
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

    if (imported > 0) {
      markLibraryDirty(scope)
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
  markLibraryDirty('input')
  markLibraryDirty('output')
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
