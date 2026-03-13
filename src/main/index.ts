import { app, BrowserWindow, clipboard, ipcMain, Menu, nativeImage } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { executeGeneration } from './services/generation'
import {
  importFilesToLibrary,
  listLibraryImages,
  refreshLibraryWatchers,
  startLibraryFileDrag,
  startLibraryWatchers,
  stopLibraryWatchers
} from './services/file-library-service'
import { addHistoryRecord, deleteHistoryRecord } from './services/history-service'
import { changeInputDir, getInputDir, openInputDir, pickInputDir } from './services/input-dir-service'
import { saveFileAs, showItemInFolder } from './services/file-operations-service'
import {
  changeOutputDir,
  getOutputDir,
  openOutputDir,
  pickOutputDir
} from './services/output-dir-service'
import { applySavedProxyConfig, saveAndApplyProxyConfig } from './services/proxy-session-service'
import { createProject, deleteProject, ensureFirstProject, renameProject } from './services/project-service'
import { runStartupMigration } from './services/startup-migration'
import {
  downloadUpdate,
  getUpdateMenuTemplate,
  initializeUpdateService,
  scheduleStartupUpdateCheck
} from './services/update-service'
import { writeUninstallPaths } from './services/uninstall-paths-writer'
import { verifyConnection } from './services/verify-service'
import { loadConfig, saveConfig } from './storage/config-storage'
import { pathToDisplayUrl, readFileAsBase64 } from './storage/file-cache-service'
import { loadHistory, saveHistory } from './storage/history-storage'
import { loadProjects, saveProjects } from './storage/project-storage'
import { loadProxyConfig } from './storage/proxy-config-storage'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindowRef: BrowserWindow | null = null

function getIconPath(): string | undefined {
  if (app.isPackaged) {
    return undefined
  }

  const iconPng = join(__dirname, '../../build/icon.png')
  const iconIco = join(__dirname, '../../build/icon.ico')

  if (existsSync(iconIco)) return iconIco
  if (existsSync(iconPng)) return iconPng

  return undefined
}

function createMenu(mainWindow: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开输出目录',
          click: async () => {
            const result = await openOutputDir()
            if (!result.success && result.error) {
              mainWindow.webContents.send('output-dir:error', result.error)
            }
          }
        },
        {
          label: '修改输出目录',
          click: async () => {
            const { path: newPath, canceled } = await pickOutputDir()
            if (canceled || !newPath) return

            const result = await changeOutputDir(newPath)
            if (result.success) {
              await refreshLibraryWatchers(mainWindow.webContents)
            }

            mainWindow.webContents.send('output-dir:changed', result)
          }
        },
        {
          label: '打开输入目录',
          click: async () => {
            const result = await openInputDir()
            if (!result.success && result.error) {
              mainWindow.webContents.send('input-dir:error', result.error)
            }
          }
        },
        {
          label: '修改输入目录',
          click: async () => {
            const { path: newPath, canceled } = await pickInputDir()
            if (canceled || !newPath) return

            const result = await changeInputDir(newPath)
            if (result.success) {
              await refreshLibraryWatchers(mainWindow.webContents)
            }

            mainWindow.webContents.send('input-dir:changed', result)
          }
        }
      ]
    },
    getUpdateMenuTemplate(),
    {
      label: '代理',
      submenu: [
        {
          label: '代理设置',
          click: () => {
            mainWindow.webContents.send('proxy:openSettings')
          }
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 Vizo',
          click: () => {
            mainWindow.webContents.send('app:openAbout')
          }
        },
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function emitLibraryChanged(scope: 'input' | 'output'): void {
  mainWindowRef?.webContents.send('library:changed', {
    scope,
    occurredAt: Date.now()
  })
}

function createWindow(): void {
  const iconPath = getIconPath()
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    ...(iconPath && { icon: iconPath }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    void (async () => {
      await initializeUpdateService(mainWindow)
      createMenu(mainWindow)
      scheduleStartupUpdateCheck()

      await startLibraryWatchers(mainWindow.webContents).catch((err) => {
        console.error('Failed to start library watchers:', err)
      })
    })()
  })

  mainWindow.on('closed', () => {
    if (mainWindowRef === mainWindow) {
      mainWindowRef = null
      stopLibraryWatchers()
    }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindowRef = mainWindow
}

ipcMain.handle('ping', () => 'pong')
ipcMain.handle('get-app-version', () => app.getVersion())
ipcMain.handle('update:download', () => downloadUpdate())

ipcMain.handle('verify-connection', async (_event, params: { apiKey: string; url?: string }) => {
  return verifyConnection(params)
})

ipcMain.handle('config:load', () => loadConfig())
ipcMain.handle('config:save', (_event, state: Parameters<typeof saveConfig>[0]) => saveConfig(state))

ipcMain.handle(
  'generation:execute',
  (_event, request: Parameters<typeof executeGeneration>[0]) => executeGeneration(request)
)

ipcMain.handle('projects:load', async () => {
  const state = await loadProjects()

  for (const project of state.projects) {
    project.previewImageUrl = project.previewImagePath
      ? pathToDisplayUrl(project.previewImagePath)
      : null
  }

  return state
})

ipcMain.handle('projects:save', (_event, state: Parameters<typeof saveProjects>[0]) => saveProjects(state))
ipcMain.handle('project:create', () => createProject())
ipcMain.handle('project:rename', (_event, projectId: string, name: string) =>
  renameProject(projectId, name)
)
ipcMain.handle('project:delete', (_event, projectId: string) => deleteProject(projectId))
ipcMain.handle('project:ensureFirst', () => ensureFirstProject())

ipcMain.handle('history:load', async () => {
  const state = await loadHistory()

  for (const record of state.records) {
    for (const image of record.inputImages) {
      image.displayUrl = pathToDisplayUrl(image.path)
    }

    for (const image of record.outputImages) {
      image.displayUrl = pathToDisplayUrl(image.path)
    }
  }

  return state
})

ipcMain.handle('history:save', (_event, state: Parameters<typeof saveHistory>[0]) => saveHistory(state))
ipcMain.handle('history:addRecord', async (_event, params: Parameters<typeof addHistoryRecord>[0]) => {
  const result = await addHistoryRecord(params)

  if (result.success) {
    emitLibraryChanged('input')
    emitLibraryChanged('output')
  }

  return result
})
ipcMain.handle('history:deleteRecord', (_event, recordId: string) => deleteHistoryRecord(recordId))

ipcMain.handle('cache:readFile', (_event, path: string) => readFileAsBase64(path))

ipcMain.handle(
  'clipboard:copyImage',
  async (_event, path: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!path || typeof path !== 'string') {
        return { success: false, error: '图片路径无效' }
      }

      if (!existsSync(path)) {
        return { success: false, error: '图片文件不存在或已被删除' }
      }

      const image = nativeImage.createFromPath(path)
      if (image.isEmpty()) {
        return { success: false, error: '无法读取图片文件' }
      }

      clipboard.writeImage(image)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message || '复制失败' }
    }
  }
)

ipcMain.handle('file:showInFolder', (_event, path: string) => showItemInFolder(path))
ipcMain.handle('file:saveAs', (_event, path: string, defaultName?: string) =>
  saveFileAs(path, defaultName)
)
ipcMain.handle(
  'library:list',
  (_event, scope: 'input' | 'output', options?: { force?: boolean }) =>
    listLibraryImages(scope, options)
)
ipcMain.handle('library:import', async (_event, scope: 'input' | 'output', sourcePaths: string[]) => {
  const result = await importFilesToLibrary(scope, sourcePaths)

  if (result.success && result.imported > 0) {
    emitLibraryChanged(scope)
  }

  return result
})

ipcMain.on('library:startDrag', (event, filePath: string) => {
  startLibraryFileDrag(event.sender, filePath)
})

ipcMain.handle('output-dir:get', () => getOutputDir())
ipcMain.handle('output-dir:open', () => openOutputDir())
ipcMain.handle('output-dir:pick', () => pickOutputDir())
ipcMain.handle('output-dir:change', async (_event, newPath: string) => {
  const result = await changeOutputDir(newPath)
  if (result.success && mainWindowRef) {
    await refreshLibraryWatchers(mainWindowRef.webContents)
  }
  return result
})

ipcMain.handle('input-dir:get', () => getInputDir())
ipcMain.handle('input-dir:open', () => openInputDir())
ipcMain.handle('input-dir:pick', () => pickInputDir())
ipcMain.handle('input-dir:change', async (_event, newPath: string) => {
  const result = await changeInputDir(newPath)
  if (result.success && mainWindowRef) {
    await refreshLibraryWatchers(mainWindowRef.webContents)
  }
  return result
})

ipcMain.handle('proxyConfig:load', () => loadProxyConfig())
ipcMain.handle('proxyConfig:save', (_event, config: Parameters<typeof saveAndApplyProxyConfig>[0]) =>
  saveAndApplyProxyConfig(config)
)

app.whenReady().then(async () => {
  await runStartupMigration()
  await writeUninstallPaths()
  await applySavedProxyConfig()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopLibraryWatchers()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
