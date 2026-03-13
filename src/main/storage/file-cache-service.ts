import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadHistory } from './history-storage'
import { loadInputDirConfig } from './input-dir-config'
import { loadOutputDirConfig } from './output-dir-config'

async function getOutputStorageDir(): Promise<string> {
  const root = await loadOutputDirConfig()
  return join(root, 'output')
}

async function getInputStorageDir(): Promise<string> {
  return loadInputDirConfig()
}

function generateCacheFilename(mimeType: string, index: number): string {
  const now = new Date()
  const pad = (value: number, length = 2) => String(value).padStart(length, '0')
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}_${pad(now.getMilliseconds(), 3)}_${pad(index, 3)}`
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg'
  return `${datePart}_${timePart}.${ext}`
}

export interface SavedImage {
  path: string
  mimeType: string
  error?: string
}

export async function saveOutputImages(
  _projectId: string,
  images: Array<{ mimeType: string; base64: string; error?: string }>
): Promise<SavedImage[]> {
  const dir = await getOutputStorageDir()
  await mkdir(dir, { recursive: true })

  const results: SavedImage[] = []
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    const filename = generateCacheFilename(image.mimeType, index)
    const path = join(dir, filename)
    const buffer = Buffer.from(image.base64, 'base64')
    await writeFile(path, buffer)
    results.push({ path, mimeType: image.mimeType, error: image.error })
  }

  return results
}

export async function saveInputImages(
  _projectId: string,
  images: Array<{ mimeType: string; base64: string }>
): Promise<SavedImage[]> {
  const dir = await getInputStorageDir()
  await mkdir(dir, { recursive: true })

  const results: SavedImage[] = []
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index]
    const filename = generateCacheFilename(image.mimeType, index)
    const path = join(dir, filename)
    const buffer = Buffer.from(image.base64, 'base64')
    await writeFile(path, buffer)
    results.push({ path, mimeType: image.mimeType })
  }

  return results
}

export async function readFileAsBase64(
  filePath: string
): Promise<{ mimeType: string; base64: string } | null> {
  try {
    if (!existsSync(filePath)) return null

    const buffer = await readFile(filePath)
    const base64 = buffer.toString('base64')
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'png'
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

    return { mimeType, base64 }
  } catch {
    return null
  }
}

export async function deleteFile(path: string): Promise<boolean> {
  try {
    if (!existsSync(path)) {
      return false
    }

    await unlink(path)
    return true
  } catch {
    return false
  }
}

export async function deleteFiles(paths: string[]): Promise<void> {
  const uniquePaths = Array.from(new Set(paths.filter(Boolean)))
  await Promise.all(uniquePaths.map((path) => deleteFile(path)))
}

export async function deleteProjectCache(projectId: string): Promise<void> {
  const historyState = await loadHistory()
  const paths = historyState.records
    .filter((record) => record.projectId === projectId)
    .flatMap((record) => [...record.outputImages.map((image) => image.path), ...record.inputImages.map((image) => image.path)])

  await deleteFiles(paths)
}

export async function getProjectCacheDir(_projectId: string): Promise<string> {
  return getOutputStorageDir()
}

export function pathToDisplayUrl(path: string): string {
  return pathToFileURL(path).href
}

export async function pathToDataUrl(path: string): Promise<string | null> {
  const data = await readFileAsBase64(path)
  if (!data) return null
  return `data:${data.mimeType};base64,${data.base64}`
}
