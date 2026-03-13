import { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { HistoryItem } from '@/components/history/HistoryItem'
import { HistoryItemGenerating } from '@/components/history/HistoryItemGenerating'
import { useHistoryStore } from '@/hooks/use-history-store'
import { useProjectStore } from '@/hooks/use-project-store'
import { useGeneratingStore } from '@/hooks/use-generating-store'
import { cn } from '@/lib/utils'

const BOTTOM_THRESHOLD = 80

export function HistoryArea() {
  const { records } = useHistoryStore()
  const { selectedProjectId } = useProjectStore()
  const generatingRecords = useGeneratingStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const prevGeneratingKey = useRef<string>('')
  const initialScrollKeyRef = useRef<string>('')

  const visibleGeneratingRecords = generatingRecords.filter(
    (record) =>
      selectedProjectId
        ? record.projectId === selectedProjectId || record.projectId === ''
        : record.projectId === ''
  )
  const generatingSignature = visibleGeneratingRecords
    .map((record) => `${record.id}-${record.successCount + record.failedCount}-${record.status}`)
    .join('|')
  const historySignature = records
    .map((record) => `${record.id}-${record.createdAt}`)
    .join('|')
  const showProjectEmptyState = !selectedProjectId && visibleGeneratingRecords.length === 0
  const showHistoryEmptyState =
    Boolean(selectedProjectId) && records.length === 0 && visibleGeneratingRecords.length === 0

  const checkNearBottom = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    const distanceFromBottom = element.scrollHeight - element.clientHeight - element.scrollTop
    setShowScrollToBottom(distanceFromBottom > BOTTOM_THRESHOLD)
  }, [])

  const scrollToLatest = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const element = scrollRef.current
      if (!element) return

      element.scrollTo({
        top: element.scrollHeight - element.clientHeight,
        behavior
      })

      setTimeout(() => {
        checkNearBottom()
      }, behavior === 'smooth' ? 180 : 0)
    },
    [checkNearBottom]
  )

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    checkNearBottom()
    element.addEventListener('scroll', checkNearBottom)
    return () => element.removeEventListener('scroll', checkNearBottom)
  }, [checkNearBottom, records.length, generatingSignature])

  useEffect(() => {
    if (showProjectEmptyState || showHistoryEmptyState) {
      initialScrollKeyRef.current = ''
      return
    }

    const nextKey = `${selectedProjectId ?? ''}:${historySignature}`
    if (initialScrollKeyRef.current === nextKey) {
      return
    }

    initialScrollKeyRef.current = nextKey

    const timer = setTimeout(() => {
      scrollToLatest('auto')
    }, 50)

    return () => clearTimeout(timer)
  }, [historySignature, scrollToLatest, selectedProjectId, showHistoryEmptyState, showProjectEmptyState])

  useEffect(() => {
    if (!generatingSignature) {
      prevGeneratingKey.current = ''
      return
    }

    if (generatingSignature === prevGeneratingKey.current) return

    prevGeneratingKey.current = generatingSignature

    const timer = setTimeout(() => {
      scrollToLatest('smooth')
    }, 50)

    return () => clearTimeout(timer)
  }, [generatingSignature, scrollToLatest])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex h-11 shrink-0 items-center border-b border-border/80 bg-background/78 px-4 backdrop-blur">
        <span className="text-sm font-semibold text-foreground/88">历史记录</span>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="app-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-3 p-4">
            {showProjectEmptyState ? (
              <p className="empty-state-card py-8 text-center">请选择或新建项目</p>
            ) : showHistoryEmptyState ? (
              <p className="empty-state-card py-8 text-center">
                当前项目还没有历史记录，生成后会显示在这里
              </p>
            ) : (
              <>
                {records.map((record) => (
                  <HistoryItem key={record.id} record={record} />
                ))}
                {visibleGeneratingRecords.map((record) => (
                  <HistoryItemGenerating key={record.id} record={record} />
                ))}
              </>
            )}
          </div>
        </div>

        {showScrollToBottom && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Button
              variant="outline"
              size="sm"
              className={cn('gap-1 border border-border/85 bg-white text-foreground shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:bg-white')}
              onClick={() => scrollToLatest('smooth')}
            >
              <span className="text-xs">v</span>
              回到底部
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
