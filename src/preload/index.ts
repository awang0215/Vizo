import { contextBridge, ipcRenderer } from 'electron'

// ��¶����Ⱦ���̵� API - ��׼ IPC �Ž�
const api = {
  ping: () => ipcRenderer.invoke('ping'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  verifyConnection: (params: { apiKey: string; url?: string }) =>
    ipcRenderer.invoke('verify-connection', params),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (state: unknown) => ipcRenderer.invoke('config:save', state),
  executeGeneration: (request: unknown) =>
    ipcRenderer.invoke('generation:execute', request),
  loadProjects: () => ipcRenderer.invoke('projects:load'),
  saveProjects: (state: unknown) => ipcRenderer.invoke('projects:save', state),
  createProject: () => ipcRenderer.invoke('project:create'),
  renameProject: (projectId: string, name: string) =>
    ipcRenderer.invoke('project:rename', projectId, name),
  deleteProject: (projectId: string) => ipcRenderer.invoke('project:delete', projectId),
  ensureFirstProject: () => ipcRenderer.invoke('project:ensureFirst'),
  loadHistory: () => ipcRenderer.invoke('history:load'),
  saveHistory: (state: unknown) => ipcRenderer.invoke('history:save', state),
  addHistoryRecord: (params: unknown) => ipcRenderer.invoke('history:addRecord', params),
  deleteHistoryRecord: (recordId: string) => ipcRenderer.invoke('history:deleteRecord', recordId),
  readCacheFile: (path: string) => ipcRenderer.invoke('cache:readFile', path),
  copyImageToClipboard: (path: string) =>
    ipcRenderer.invoke('clipboard:copyImage', path),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  getOutputDir: () => ipcRenderer.invoke('output-dir:get'),
  getInputDir: () => ipcRenderer.invoke('input-dir:get'),
  loadProxyConfig: () => ipcRenderer.invoke('proxyConfig:load'),
  saveProxyConfig: (config: unknown) => ipcRenderer.invoke('proxyConfig:save', config),
  showItemInFolder: (path: string) => ipcRenderer.invoke('file:showInFolder', path),
  saveFileAs: (path: string, defaultName?: string) =>
    ipcRenderer.invoke('file:saveAs', path, defaultName),
  listLibraryImages: (scope: 'input' | 'output') => ipcRenderer.invoke('library:list', scope),
  importFilesToLibrary: (scope: 'input' | 'output', sourcePaths: string[]) =>
    ipcRenderer.invoke('library:import', scope, sourcePaths),
  startLibraryFileDrag: (path: string) => ipcRenderer.send('library:startDrag', path),
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const subscription = (_: unknown, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => ipcRenderer.removeListener(channel, subscription)
  },
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (err) {
    console.error(err)
  }
} else {
  (window as unknown as { electronAPI: typeof api }).electronAPI = api
}
