import type { ModelId } from '../renderer/src/types/config'

export interface VerifyConnectionParams {
  apiKey: string
  url?: string
}

export interface VerifyConnectionResult {
  success: boolean
  message: string
}

export interface GenerationRequest {
  modelId: ModelId
  apiKey: string
  baseUrl: string
  proModelOverride: string
  flashModelOverride: string
  promptText: string
  inputImagesBase64: Array<{ mimeType: string; base64: string }>
  resolutionPreset: string
  outputCount: number
  aspectRatio: string
}

export interface GenerationResponse {
  success: boolean
  images?: Array<{ mimeType: string; base64: string }>
  error?: string
}

export interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  previewImagePath: string | null
  previewImageUrl?: string | null
  recordIds: string[]
  promptPresets?: Array<{
    id: string
    title: string
    content: string
  }>
  selectedPromptPresetIds?: string[]
}

export interface ProjectsState {
  projects: Project[]
  selectedProjectId: string | null
}

export interface HistoryImageRef {
  path: string
  mimeType: string
  displayUrl?: string
  error?: string
}

export interface HistoryRecordData {
  id: string
  projectId: string
  userPromptText?: string
  promptText: string
  inputImages: HistoryImageRef[]
  outputImages: HistoryImageRef[]
  model: string
  configId: string
  aspectRatio: string
  resolutionPreset: string
  outputCount: number
  createdAt: string
}

export interface HistoryState {
  records: HistoryRecordData[]
}

export interface AddHistoryRecordParams {
  projectId: string
  userPromptText: string
  promptText: string
  inputImagesBase64: Array<{ mimeType: string; base64: string }>
  outputImagesBase64: Array<{ mimeType: string; base64: string; error?: string }>
  model: string
  configId: string
  aspectRatio: string
  resolutionPreset: string
  outputCount: number
}

export interface AddHistoryRecordResult {
  success: boolean
  record?: HistoryRecordData
  error?: string
}

export interface DeleteRecordResult {
  success: boolean
  error?: string
}

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

export interface LibraryImportResult {
  success: boolean
  imported: number
  error?: string
}

export interface CreateProjectResult {
  success: boolean
  project?: Project
  error?: string
}

export interface DeleteProjectResult {
  success: boolean
  newSelectedId?: string | null
  error?: string
}

export interface RenameProjectResult {
  success: boolean
  error?: string
}

export interface PersistedState {
  configs: Array<{
    id: string
    name: string
    apiKey: string
    url: string
    lastVerifiedAt: string | null
    verifyStatus: string
  }>
  selectedConfigId: string | null
  selectedModel: string
}

export interface ElectronAPI {
  ping: () => Promise<string>
  getAppVersion: () => Promise<string>
  verifyConnection: (params: VerifyConnectionParams) => Promise<VerifyConnectionResult>
  loadConfig: () => Promise<PersistedState | null>
  saveConfig: (state: PersistedState) => Promise<void>
  executeGeneration: (request: GenerationRequest) => Promise<GenerationResponse>
  loadProjects: () => Promise<ProjectsState>
  saveProjects: (state: ProjectsState) => Promise<void>
  createProject: () => Promise<CreateProjectResult>
  renameProject: (projectId: string, name: string) => Promise<RenameProjectResult>
  deleteProject: (projectId: string) => Promise<DeleteProjectResult>
  ensureFirstProject: () => Promise<{ projectId: string } | null>
  loadHistory: () => Promise<HistoryState>
  saveHistory: (state: HistoryState) => Promise<void>
  addHistoryRecord: (params: AddHistoryRecordParams) => Promise<AddHistoryRecordResult>
  deleteHistoryRecord: (recordId: string) => Promise<DeleteRecordResult>
  readCacheFile: (path: string) => Promise<{ mimeType: string; base64: string } | null>
  copyImageToClipboard: (path: string) => Promise<{ success: boolean; error?: string }>
  downloadUpdate: () => Promise<void>
  getOutputDir: () => Promise<string>
  getInputDir: () => Promise<string>
  loadProxyConfig: () => Promise<{ proxyMode: string; proxyHost: string; proxyPort: string }>
  saveProxyConfig: (config: { proxyMode: string; proxyHost: string; proxyPort: string }) => Promise<void>
  showItemInFolder: (path: string) => Promise<{ success: boolean; error?: string }>
  saveFileAs: (path: string, defaultName?: string) => Promise<{
    success: boolean
    savedPath?: string
    error?: string
  }>
  listLibraryImages: (
    scope: LibraryScope,
    options?: { force?: boolean }
  ) => Promise<LibraryListResult>
  importFilesToLibrary: (scope: LibraryScope, sourcePaths: string[]) => Promise<LibraryImportResult>
  startLibraryFileDrag: (path: string) => void
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void
  send: (channel: string, ...args: unknown[]) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
