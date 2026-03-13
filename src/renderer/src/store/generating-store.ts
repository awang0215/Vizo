import type { HistoryImageRef } from '@/types/history'

export interface GeneratingOutputSlot {
  status: 'loading' | 'success' | 'failed'
  displayUrl: string
  mimeType?: string
  base64?: string
  error?: string
}

export interface GeneratingRecord {
  id: string
  projectId: string
  promptText: string
  inputImages: HistoryImageRef[]
  outputSlots: GeneratingOutputSlot[]
  aspectRatio: string
  total: number
  successCount: number
  failedCount: number
  status: 'generating' | 'completed' | 'partial_failure'
  createdAt: string
}

let generatingRecords: GeneratingRecord[] = []
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

function updateRecord(recordId: string, updater: (record: GeneratingRecord) => GeneratingRecord) {
  let changed = false

  generatingRecords = generatingRecords.map((record) => {
    if (record.id !== recordId) return record

    const nextRecord = updater(record)
    changed = nextRecord !== record
    return nextRecord
  })

  if (changed) {
    notify()
  }
}

export const generatingStore = {
  get(): GeneratingRecord[] {
    return generatingRecords
  },

  add(record: GeneratingRecord) {
    generatingRecords = [...generatingRecords, record]
    notify()
  },

  remove(recordId: string) {
    const nextRecords = generatingRecords.filter((record) => record.id !== recordId)
    if (nextRecords.length === generatingRecords.length) return

    generatingRecords = nextRecords
    notify()
  },

  setProjectId(recordId: string, projectId: string) {
    updateRecord(recordId, (record) => ({ ...record, projectId }))
  },

  resolveOutput(
    recordId: string,
    index: number,
    image: Omit<GeneratingOutputSlot, 'status' | 'error'>
  ) {
    updateRecord(recordId, (record) => {
      if (index < 0 || index >= record.outputSlots.length) return record

      const outputSlots = [...record.outputSlots]
      outputSlots[index] = {
        status: 'success',
        displayUrl: image.displayUrl,
        mimeType: image.mimeType,
        base64: image.base64
      }

      return {
        ...record,
        outputSlots,
        successCount: record.successCount + 1
      }
    })
  },

  failOutput(
    recordId: string,
    index: number,
    image: Omit<GeneratingOutputSlot, 'status' | 'error'>,
    error: string
  ) {
    updateRecord(recordId, (record) => {
      if (index < 0 || index >= record.outputSlots.length) return record

      const outputSlots = [...record.outputSlots]
      outputSlots[index] = {
        status: 'failed',
        displayUrl: image.displayUrl,
        mimeType: image.mimeType,
        base64: image.base64,
        error
      }

      return {
        ...record,
        outputSlots,
        failedCount: record.failedCount + 1
      }
    })
  },

  setStatus(recordId: string, status: GeneratingRecord['status']) {
    updateRecord(recordId, (record) => ({ ...record, status }))
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
}
