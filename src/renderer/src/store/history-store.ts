import type { HistoryRecord } from '@/types/history'

let records: HistoryRecord[] = []
const listeners = new Set<() => void>()

// ���� getRecordsByProject ��������� useSyncExternalStore ÿ�εõ�����������
let cachedProjectId: string | null = null
let cachedRecordsRef: HistoryRecord[] | null = null
let cachedResult: HistoryRecord[] = []

function notify() {
  listeners.forEach((fn) => fn())
}

async function loadFromMain() {
  if (typeof window?.electronAPI?.loadHistory !== 'function') return
  const state = await window.electronAPI.loadHistory()
  records = state.records ?? []
}

export const historyStore = {
  async load(): Promise<void> {
    await loadFromMain()
    notify()
  },

  getRecords(): HistoryRecord[] {
    return records
  },

  getRecordsByProject(projectId: string): HistoryRecord[] {
    if (cachedProjectId === projectId && cachedRecordsRef === records) {
      return cachedResult
    }
    cachedProjectId = projectId
    cachedRecordsRef = records
    cachedResult = records
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return cachedResult
  },

  setRecords(list: HistoryRecord[]) {
    records = list
    cachedRecordsRef = null
    notify()
  },

  addRecord(record: HistoryRecord) {
    records = [record, ...records]
    cachedRecordsRef = null
    notify()
  },

  removeRecord(id: string) {
    records = records.filter((r) => r.id !== id)
    cachedRecordsRef = null
    notify()
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
}
