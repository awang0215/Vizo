import { useSyncExternalStore } from 'react'
import { generatingStore } from '@/store/generating-store'

export function useGeneratingStore() {
  const generatingRecords = useSyncExternalStore(
    generatingStore.subscribe,
    () => generatingStore.get(),
    () => generatingStore.get()
  )
  return generatingRecords
}
