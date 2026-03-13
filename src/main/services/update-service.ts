import { app, BrowserWindow } from 'electron'
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'
import {
  loadUpdatePreferences,
  saveUpdatePreferences,
  type UpdatePreferences
} from '../storage/update-preferences-storage'

type UpdateCheckSource = 'manual' | 'startup'

type UpdateDialogPayload =
  | {
      kind: 'checking'
      title: string
      message: string
      detail?: string
      dismissText?: string
    }
  | {
      kind: 'available'
      title: string
      message: string
      detail?: string
      version: string
      releaseNotes: string
      confirmText: string
      cancelText: string
    }
  | {
      kind: 'downloading'
      title: string
      message: string
      detail?: string
      progressPercent?: number
      dismissText?: string
    }
  | {
      kind: 'info' | 'error'
      title: string
      message: string
      detail?: string
      dismissText?: string
    }

const COPY = {
  update: '更新',
  checkUpdate: '检查更新',
  checking: '正在检查更新...',
  checkingDetail: '请稍候，正在连接 GitHub Releases。',
  latest: '目前软件为最新版。',
  updateFailed: '更新失败',
  updateFailedMessage: '检查或下载更新时发生错误。',
  startDownloadFailed: '无法开始下载更新。',
  foundNewVersion: '发现新版本',
  updateAvailableMessage: '检测到新版本，以下是本次更新内容。',
  updateContent: '更新内容',
  updateNow: '立即更新',
  cancel: '取消',
  close: '关闭',
  disableUpdate: '关闭更新',
  downloadUpdate: '下载更新',
  downloading: '正在下载更新...',
  downloadDetail: '下载完成后将自动退出并安装新版本。',
  installing: '下载完成，正在准备安装...',
  noReleaseNotes: '本次版本暂未提供更新说明。',
  unpackedUnsupported:
    '当前正在使用未安装的解压版（win-unpacked），自动更新仅在通过 Setup.exe 安装后的版本中可用。',
  devUnsupported: '开发模式下不支持自动更新，请使用安装版测试。',
  platformUnsupported: '自动更新目前仅支持 Windows 安装版。',
  checkingInProgress: '正在检查更新，请稍候。',
  downloadingInProgress: '更新正在下载中，请稍候。',
  releaseArtifactsMissing:
    'GitHub Release 中还没有找到对应的 latest.yml。\n\n请先发布当前版本，并确保 Release 同时上传以下文件：\n- Setup.exe\n- Setup.exe.blockmap\n- latest.yml',
  noPublishedReleases:
    'GitHub Releases 当前为空，还没有可用于更新的发布版本。\n\n请先在 GitHub 上发布至少一个包含以下文件的正式 Release：\n- Setup.exe\n- Setup.exe.blockmap\n- latest.yml',
  networkError: '无法连接更新服务器，请检查网络或代理设置后重试。'
} as const

const STARTUP_CHECK_DELAY_MS = 3000

let ownerWindow: BrowserWindow | null = null
let preferences: UpdatePreferences = {
  neverUpdate: false
}
let updaterReady = false
let isChecking = false
let isDownloading = false
let lastCheckSource: UpdateCheckSource | null = null
let downloadRequestedByUser = false

function sendUpdateDialog(payload: UpdateDialogPayload): void {
  if (!ownerWindow || ownerWindow.isDestroyed()) {
    return
  }

  ownerWindow.webContents.send('update:dialog', payload)
}

function isRunningUnpackedBuild(): boolean {
  const exePath = app.getPath('exe').replace(/\//g, '\\').toLowerCase()
  return exePath.includes('\\win-unpacked\\')
}

function getUnsupportedReason(): string | null {
  if (process.platform !== 'win32') {
    return COPY.platformUnsupported
  }

  if (!app.isPackaged) {
    return COPY.devUnsupported
  }

  if (isRunningUnpackedBuild()) {
    return COPY.unpackedUnsupported
  }

  return null
}

function isAutoUpdateSupported(): boolean {
  return getUnsupportedReason() === null
}

function resetMainWindowProgress(): void {
  if (ownerWindow && !ownerWindow.isDestroyed()) {
    ownerWindow.setProgressBar(-1)
  }
}

function setMainWindowProgress(
  value: number,
  mode?: 'none' | 'normal' | 'indeterminate' | 'error' | 'paused'
): void {
  if (ownerWindow && !ownerWindow.isDestroyed()) {
    ownerWindow.setProgressBar(value, mode ? { mode } : undefined)
  }
}

function normalizeReleaseNotes(notes: UpdateInfo['releaseNotes']): string {
  if (!notes) {
    return COPY.noReleaseNotes
  }

  const rawText =
    typeof notes === 'string'
      ? notes
      : notes
          .map((item) => {
            if (typeof item === 'string') {
              return item
            }

            return item.note ?? ''
          })
          .filter(Boolean)
          .join('\n\n')

  const cleaned = rawText
    .replace(/\r\n/g, '\n')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '- ')
    .trim()

  return cleaned || COPY.noReleaseNotes
}

function formatFriendlyUpdateError(error: unknown): string {
  const raw = error == null ? '' : error instanceof Error ? error.message : String(error)
  const normalized = raw.replace(/\r\n/g, '\n').trim()

  if (/latest\.yml/i.test(normalized) && /\b404\b/i.test(normalized)) {
    return COPY.releaseArtifactsMissing
  }

  if (/cannot find latest\.yml/i.test(normalized) || /latest release artifacts/i.test(normalized)) {
    return COPY.releaseArtifactsMissing
  }

  if (
    /no published versions on github/i.test(normalized) ||
    /unable to find latest version on github/i.test(normalized) ||
    /production release exists/i.test(normalized) ||
    /err_updater_no_published_versions/i.test(normalized) ||
    /err_updater_latest_version_not_found/i.test(normalized)
  ) {
    return COPY.noPublishedReleases
  }

  if (
    /\beconnrefused\b|\benotfound\b|\beconnreset\b|\betimedout\b|\bnetwork\b|\btimeout\b|\bsocket\b|net::err_|unable to connect|failed to connect|proxy error/i.test(
      normalized
    )
  ) {
    return COPY.networkError
  }

  return normalized || '未知错误'
}

function resetUpdaterState(): void {
  isChecking = false
  isDownloading = false
  lastCheckSource = null
  downloadRequestedByUser = false
  resetMainWindowProgress()
}

function handleUpdateFailure(
  error: unknown,
  shouldNotifyUser: boolean,
  message = COPY.updateFailedMessage
): void {
  const detail = formatFriendlyUpdateError(error)
  resetUpdaterState()

  if (shouldNotifyUser) {
    sendUpdateDialog({
      kind: 'error',
      title: COPY.updateFailed,
      message,
      detail,
      dismissText: COPY.close
    })
    return
  }

  console.error('Auto update failed:', error)
}

function bindAutoUpdaterEvents(): void {
  if (updaterReady || !isAutoUpdateSupported()) {
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowPrerelease = false

  autoUpdater.on('checking-for-update', () => {
    isChecking = true

    if (lastCheckSource === 'manual') {
      sendUpdateDialog({
        kind: 'checking',
        title: COPY.checkUpdate,
        message: COPY.checking,
        detail: COPY.checkingDetail,
        dismissText: COPY.cancel
      })
    }
  })

  autoUpdater.on('update-available', (info) => {
    isChecking = false
    resetMainWindowProgress()

    sendUpdateDialog({
      kind: 'available',
      title: COPY.foundNewVersion,
      message: COPY.updateAvailableMessage,
      detail: COPY.updateContent,
      version: info.version,
      releaseNotes: normalizeReleaseNotes(info.releaseNotes),
      confirmText: COPY.updateNow,
      cancelText: COPY.cancel
    })

    lastCheckSource = null
  })

  autoUpdater.on('update-not-available', () => {
    const shouldNotifyUser = lastCheckSource === 'manual'

    isChecking = false
    lastCheckSource = null
    resetMainWindowProgress()

    if (shouldNotifyUser) {
      sendUpdateDialog({
        kind: 'info',
        title: COPY.checkUpdate,
        message: COPY.latest,
        dismissText: COPY.close
      })
    }
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    if (!isDownloading) {
      return
    }

    const percent = Math.max(0, Math.min(100, Math.round(progress.percent)))
    const downloadedMB = (progress.transferred / 1024 / 1024).toFixed(1)
    const totalMB = (progress.total / 1024 / 1024).toFixed(1)
    const speedMB = (progress.bytesPerSecond / 1024 / 1024).toFixed(1)

    setMainWindowProgress(progress.percent / 100, 'normal')
    sendUpdateDialog({
      kind: 'downloading',
      title: COPY.downloadUpdate,
      message: `${COPY.downloading} ${percent}%`,
      detail: `已下载 ${downloadedMB} MB / ${totalMB} MB\n当前速度 ${speedMB} MB/s`,
      progressPercent: percent,
      dismissText: COPY.close
    })
  })

  autoUpdater.on('update-downloaded', () => {
    sendUpdateDialog({
      kind: 'downloading',
      title: COPY.downloadUpdate,
      message: COPY.installing,
      detail: COPY.downloadDetail,
      progressPercent: 100,
      dismissText: COPY.close
    })

    isDownloading = false
    downloadRequestedByUser = false
    resetMainWindowProgress()

    setTimeout(() => {
      autoUpdater.quitAndInstall()
    }, 400)
  })

  autoUpdater.on('error', (error) => {
    const shouldNotifyUser =
      lastCheckSource === 'manual' || downloadRequestedByUser || isDownloading

    handleUpdateFailure(error, shouldNotifyUser)
  })

  updaterReady = true
}

export async function initializeUpdateService(mainWindow: BrowserWindow): Promise<void> {
  ownerWindow = mainWindow
  preferences = await loadUpdatePreferences()
  bindAutoUpdaterEvents()
}

export function getUpdateMenuTemplate(): Electron.MenuItemConstructorOptions {
  return {
    label: COPY.update,
    submenu: [
      {
        label: COPY.disableUpdate,
        type: 'checkbox',
        checked: preferences.neverUpdate,
        click: (menuItem) => {
          preferences = {
            ...preferences,
            neverUpdate: menuItem.checked
          }

          void saveUpdatePreferences(preferences).catch((error: unknown) => {
            console.error('Failed to save update preferences:', error)
          })
        }
      },
      {
        label: COPY.checkUpdate,
        click: () => {
          void checkForUpdates('manual')
        }
      }
    ]
  }
}

export function scheduleStartupUpdateCheck(): void {
  if (!isAutoUpdateSupported() || preferences.neverUpdate) {
    return
  }

  setTimeout(() => {
    void checkForUpdates('startup')
  }, STARTUP_CHECK_DELAY_MS)
}

export async function checkForUpdates(source: UpdateCheckSource): Promise<void> {
  const unsupportedReason = getUnsupportedReason()

  if (unsupportedReason) {
    if (source === 'manual') {
      sendUpdateDialog({
        kind: 'info',
        title: COPY.checkUpdate,
        message: unsupportedReason,
        dismissText: COPY.close
      })
    }
    return
  }

  if (isChecking) {
    if (source === 'manual') {
      sendUpdateDialog({
        kind: 'info',
        title: COPY.checkUpdate,
        message: COPY.checkingInProgress,
        dismissText: COPY.close
      })
    }
    return
  }

  if (isDownloading) {
    if (source === 'manual') {
      sendUpdateDialog({
        kind: 'info',
        title: COPY.checkUpdate,
        message: COPY.downloadingInProgress,
        dismissText: COPY.close
      })
    }
    return
  }

  lastCheckSource = source

  if (source === 'manual') {
    sendUpdateDialog({
      kind: 'checking',
      title: COPY.checkUpdate,
      message: COPY.checking,
      detail: COPY.checkingDetail,
      dismissText: COPY.cancel
    })
  }

  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    handleUpdateFailure(error, source === 'manual')
  }
}

export async function downloadUpdate(): Promise<void> {
  const unsupportedReason = getUnsupportedReason()

  if (unsupportedReason) {
    sendUpdateDialog({
      kind: 'info',
      title: COPY.checkUpdate,
      message: unsupportedReason,
      dismissText: COPY.close
    })
    return
  }

  if (isDownloading) {
    sendUpdateDialog({
      kind: 'info',
      title: COPY.downloadUpdate,
      message: COPY.downloadingInProgress,
      dismissText: COPY.close
    })
    return
  }

  downloadRequestedByUser = true
  isDownloading = true

  sendUpdateDialog({
    kind: 'downloading',
    title: COPY.downloadUpdate,
    message: COPY.downloading,
    detail: COPY.downloadDetail,
    progressPercent: 0,
    dismissText: COPY.close
  })

  setMainWindowProgress(0, 'normal')

  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    handleUpdateFailure(error, true, COPY.startDownloadFailed)
  }
}
