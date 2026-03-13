import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { HISTORY_IMAGE_TYPE } from '@/hooks/use-drop-zone'
import { cn } from '@/lib/utils'

type LibraryScope = 'input' | 'output'

interface LibraryImageItem {
  path: string
  name: string
  displayUrl: string
  thumbnailUrl?: string
  relativePath: string
  modifiedAt: number
  createdAt: number
}

interface HiddenLibraryState {
  input: string[]
  output: string[]
}

interface LibraryScopeCache {
  items: LibraryImageItem[]
  directory: string
  error: string
}

const HIDDEN_STORAGE_KEY = 'vizo.hidden-library-files.v1'

function areLibraryItemsEqual(left: LibraryImageItem[], right: LibraryImageItem[]): boolean {
  if (left === right) {
    return true
  }

  if (left.length !== right.length) {
    return false
  }

  return left.every((item, index) => {
    const nextItem = right[index]
    return (
      item.path === nextItem.path &&
      item.displayUrl === nextItem.displayUrl &&
      item.thumbnailUrl === nextItem.thumbnailUrl &&
      item.relativePath === nextItem.relativePath &&
      item.modifiedAt === nextItem.modifiedAt &&
      item.createdAt === nextItem.createdAt
    )
  })
}

function isLibraryStateEqual(left: LibraryScopeCache | undefined, right: LibraryScopeCache): boolean {
  if (!left) {
    return false
  }

  return (
    left.directory === right.directory &&
    left.error === right.error &&
    areLibraryItemsEqual(left.items, right.items)
  )
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase()
}

function loadHiddenState(): HiddenLibraryState {
  if (typeof window === 'undefined') {
    return { input: [], output: [] }
  }

  try {
    const raw = window.localStorage.getItem(HIDDEN_STORAGE_KEY)
    if (!raw) {
      return { input: [], output: [] }
    }

    const parsed = JSON.parse(raw) as Partial<HiddenLibraryState>
    return {
      input: Array.isArray(parsed.input) ? parsed.input : [],
      output: Array.isArray(parsed.output) ? parsed.output : []
    }
  } catch {
    return { input: [], output: [] }
  }
}

function saveHiddenState(nextState: HiddenLibraryState): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify(nextState))
}

function getMimeType(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'image/png'
  if (extension === 'webp') return 'image/webp'
  if (extension === 'gif') return 'image/gif'
  if (extension === 'bmp') return 'image/bmp'
  return 'image/jpeg'
}

const FileLibraryItem = memo(function FileLibraryItem({
  item,
  onHide
}: {
  item: LibraryImageItem
  onHide: (path: string) => void
}) {
  const [loadFailed, setLoadFailed] = useState(false)
  const previewUrl = item.thumbnailUrl || item.displayUrl

  useEffect(() => {
    setLoadFailed(false)
  }, [item.modifiedAt, item.path, previewUrl])

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    const payload = JSON.stringify({ path: item.path })
    const mimeType = getMimeType(item.path)

    event.dataTransfer.setData(HISTORY_IMAGE_TYPE, payload)
    event.dataTransfer.setData('text/plain', item.name)
    event.dataTransfer.setData('DownloadURL', `${mimeType}:${item.name}:${item.displayUrl}`)
    event.dataTransfer.effectAllowed = 'copy'

    window.electronAPI.startLibraryFileDrag(item.path)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      title={item.relativePath}
      className="group relative aspect-square overflow-hidden rounded-xl border border-border/70 bg-background/84 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-150 hover:border-primary/25 hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
    >
      {loadFailed ? (
        <div className="flex h-full w-full items-center justify-center bg-muted/35 px-2 text-center text-[11px] leading-4 text-muted-foreground">
          图片无法显示
        </div>
      ) : (
        <img
          src={previewUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          decoding="async"
          onError={() => setLoadFailed(true)}
        />
      )}

      <button
        type="button"
        aria-label="隐藏图片"
        onClick={(event) => {
          event.stopPropagation()
          onHide(item.path)
        }}
        className="thumbnail-delete-btn h-6 w-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
},
(previousProps, nextProps) =>
  previousProps.item.path === nextProps.item.path &&
  previousProps.item.displayUrl === nextProps.item.displayUrl &&
  previousProps.item.thumbnailUrl === nextProps.item.thumbnailUrl &&
  previousProps.item.modifiedAt === nextProps.item.modifiedAt &&
  previousProps.onHide === nextProps.onHide
)

export function FileLibraryPanel() {
  const [scope, setScope] = useState<LibraryScope>('input')
  const [items, setItems] = useState<LibraryImageItem[]>([])
  const [directory, setDirectory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [isDropTarget, setIsDropTarget] = useState(false)
  const [hiddenState, setHiddenState] = useState<HiddenLibraryState>(() => loadHiddenState())
  const requestIdRef = useRef(0)
  const cacheRef = useRef<Partial<Record<LibraryScope, LibraryScopeCache>>>({})

  const applyLibraryState = useCallback((nextState: LibraryScopeCache) => {
    startTransition(() => {
      setDirectory((current) => (current === nextState.directory ? current : nextState.directory))
      setItems((current) => (areLibraryItemsEqual(current, nextState.items) ? current : nextState.items))
      setError((current) => (current === nextState.error ? current : nextState.error))
      setLoading(false)
    })
  }, [])

  const refreshItems = useCallback(
    async (targetScope: LibraryScope, options?: { silent?: boolean; force?: boolean }) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (!options?.silent) {
        setLoading(true)
      }

      try {
        const result = await window.electronAPI.listLibraryImages(targetScope, {
          force: options?.force
        })
        if (requestIdRef.current !== requestId) {
          return
        }

        const nextState: LibraryScopeCache = {
          directory: result.directory,
          items: result.items ?? [],
          error: result.success ? '' : result.error || '读取目录失败'
        }

        const previousState = cacheRef.current[targetScope]
        if (isLibraryStateEqual(previousState, nextState)) {
          if (!options?.silent) {
            setLoading(false)
          }
          return
        }

        cacheRef.current[targetScope] = nextState
        applyLibraryState(nextState)
      } catch (cause) {
        if (requestIdRef.current !== requestId) {
          return
        }

        const nextState: LibraryScopeCache = {
          directory: '',
          items: [],
          error: cause instanceof Error ? cause.message : '读取目录失败'
        }

        const previousState = cacheRef.current[targetScope]
        if (isLibraryStateEqual(previousState, nextState)) {
          if (!options?.silent) {
            setLoading(false)
          }
          return
        }

        cacheRef.current[targetScope] = nextState
        applyLibraryState(nextState)
      }
    },
    [applyLibraryState]
  )

  useEffect(() => {
    const cached = cacheRef.current[scope]
    if (cached) {
      applyLibraryState(cached)
      void refreshItems(scope, { silent: true })
      return
    }

    void refreshItems(scope)
  }, [applyLibraryState, refreshItems, scope])

  useEffect(() => {
    const unsubscribe = window.electronAPI.on(
      'library:changed',
      (payload?: { scope?: LibraryScope }) => {
        if (payload?.scope && payload.scope !== scope) {
          if (payload.scope) {
            void refreshItems(payload.scope, { silent: true, force: true })
          }
          return
        }

        void refreshItems(scope, { silent: true, force: true })
      }
    )

    const handleWindowFocus = () => {
      void refreshItems(scope, { silent: true, force: true })
    }

    window.addEventListener('focus', handleWindowFocus)

    return () => {
      unsubscribe()
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [refreshItems, scope])

  const visibleItems = useMemo(() => {
    const hiddenPaths = new Set(hiddenState[scope].map(normalizePath))
    return items.filter((item) => !hiddenPaths.has(normalizePath(item.path)))
  }, [hiddenState, items, scope])

  const handleHide = useCallback(
    (filePath: string) => {
      setHiddenState((currentState) => {
        const normalizedPath = normalizePath(filePath)
        const nextState: HiddenLibraryState = {
          input: [...currentState.input],
          output: [...currentState.output]
        }

        if (!nextState[scope].includes(normalizedPath)) {
          nextState[scope] = [...nextState[scope], normalizedPath]
        }

        saveHiddenState(nextState)
        return nextState
      })

      toast.success('已从文件面板隐藏，不会删除磁盘文件')
    },
    [scope]
  )

  const handleDropImport = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDropTarget(false)

    const sourcePaths = Array.from(event.dataTransfer.files)
      .map((file) => (file as File & { path?: string }).path)
      .filter((value): value is string => Boolean(value))

    if (sourcePaths.length === 0) {
      return
    }

    const result = await window.electronAPI.importFilesToLibrary(scope, sourcePaths)
    if (!result.success) {
      toast.error(result.error || '导入图片失败')
      return
    }

    if (result.imported === 0) {
      toast.error('未导入任何图片，请确认拖入的是图片文件')
      return
    }

    toast.success(`已导入 ${result.imported} 张图片`)
    void refreshItems(scope, { silent: true, force: true })
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return
    }

    setIsDropTarget(false)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border/80 bg-background/72 p-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          {([
            ['input', '输入'],
            ['output', '输出']
          ] as const).map(([value, label]) => {
            const active = scope === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-background text-foreground shadow-[0_4px_14px_rgba(15,23,42,0.08)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          className="soft-toolbar-btn"
          onClick={() => void refreshItems(scope, { force: true })}
        >
          刷新
        </button>
      </div>

      <div className="mb-3 px-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/90">
          当前目录
        </p>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={directory}>
          {directory || '--'}
        </p>
      </div>

      <div
        className={cn(
          'section-card flex min-h-0 flex-1 flex-col overflow-hidden',
          isDropTarget && 'border-primary/35 bg-primary/6 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]'
        )}
        onDragOver={(event) => {
          event.preventDefault()
          event.stopPropagation()

          const hasFiles = Array.from(event.dataTransfer.types).includes('Files')
          setIsDropTarget(hasFiles)
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleDropImport}
      >
        <div className="app-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 pr-2">
          {loading ? (
            <div className="flex min-h-full items-center justify-center text-sm text-muted-foreground">
              正在加载图片...
            </div>
          ) : error ? (
            <div className="empty-state-card flex min-h-full flex-col items-start justify-center gap-2">
              <span className="text-sm font-medium text-foreground">目录读取失败</span>
              <span className="text-xs leading-5 text-muted-foreground">{error}</span>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="empty-state-card flex min-h-full flex-col items-start justify-center gap-2">
              <span className="text-sm font-medium text-foreground">
                当前{scope === 'input' ? '输入' : '输出'}目录暂无图片
              </span>
              <span className="text-xs leading-5 text-muted-foreground">
                可将电脑中的图片直接拖入这里，新的图片会自动刷新显示。
              </span>
            </div>
          ) : (
            <div className="grid content-start grid-cols-3 gap-2">
              {visibleItems.map((item) => (
                <FileLibraryItem key={item.path} item={item} onHide={handleHide} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
