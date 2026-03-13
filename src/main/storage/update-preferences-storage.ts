import { app } from 'electron'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const UPDATE_PREFERENCES_FILENAME = 'update-preferences.json'

export interface UpdatePreferences {
  neverUpdate: boolean
}

const DEFAULT_UPDATE_PREFERENCES: UpdatePreferences = {
  neverUpdate: false
}

function getUpdatePreferencesPath(): string {
  return join(app.getPath('userData'), UPDATE_PREFERENCES_FILENAME)
}

export async function loadUpdatePreferences(): Promise<UpdatePreferences> {
  try {
    const filePath = getUpdatePreferencesPath()
    const raw = await readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<UpdatePreferences>

    return {
      neverUpdate: parsed.neverUpdate === true
    }
  } catch {
    return { ...DEFAULT_UPDATE_PREFERENCES }
  }
}

export async function saveUpdatePreferences(preferences: UpdatePreferences): Promise<void> {
  const filePath = getUpdatePreferencesPath()
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(preferences, null, 2), 'utf-8')
}
