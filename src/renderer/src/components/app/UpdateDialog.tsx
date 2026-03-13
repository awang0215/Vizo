import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export type UpdateDialogState =
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

interface UpdateDialogProps {
  state: UpdateDialogState | null
  onOpenChange: (open: boolean) => void
  onConfirmUpdate: () => void | Promise<void>
}

function Spinner() {
  return (
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin" />
    </div>
  )
}

function StatusIcon({ kind }: { kind: 'info' | 'error' }) {
  return (
    <div
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-[0_12px_26px_rgba(15,23,42,0.12)]',
        kind === 'error'
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-primary text-primary-foreground'
      )}
    >
      {kind === 'error' ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 9-6 6" />
          <path d="m9 9 6 6" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </div>
  )
}

export function UpdateDialog({ state, onOpenChange, onConfirmUpdate }: UpdateDialogProps) {
  const open = state !== null

  if (!state) {
    return null
  }

  const isChecking = state.kind === 'checking'
  const isDownloading = state.kind === 'downloading'
  const isAvailable = state.kind === 'available'
  const isInfo = state.kind === 'info'
  const isError = state.kind === 'error'
  const progressPercent =
    state.kind === 'downloading'
      ? Math.max(0, Math.min(100, state.progressPercent ?? 0))
      : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden border-border/85 bg-background/95 p-0">
        <div className="border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_50%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] px-6 py-5">
          <DialogHeader className="gap-4 text-left">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                {isChecking || isDownloading ? (
                  <Spinner />
                ) : (
                  <StatusIcon kind={isError ? 'error' : 'info'} />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="text-[22px] font-semibold tracking-[0.01em]">
                  {state.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-muted-foreground">
                  {state.message}
                </DialogDescription>
                {state.kind === 'available' && (
                  <div className="inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                    新版本 {state.version}
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          {(isChecking || isDownloading) && state.detail ? (
            <div className="rounded-2xl border border-border/75 bg-muted/25 p-4 text-sm leading-7 text-muted-foreground">
              {state.detail}
            </div>
          ) : null}

          {isDownloading ? (
            <div className="space-y-2 rounded-2xl border border-border/75 bg-background/84 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>下载进度</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted/70">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          {isAvailable ? (
            <div className="space-y-3 rounded-2xl border border-border/75 bg-background/84 p-4">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/85">
                  更新内容
                </p>
                {state.detail ? (
                  <p className="text-sm leading-6 text-muted-foreground">{state.detail}</p>
                ) : null}
              </div>
              <ScrollArea className="h-56 rounded-xl border border-border/70 bg-muted/20">
                <div className="p-4 text-sm leading-7 text-foreground whitespace-pre-wrap">
                  {state.releaseNotes}
                </div>
              </ScrollArea>
            </div>
          ) : null}

          {(isInfo || isError) && state.detail ? (
            <div
              className={cn(
                'rounded-2xl border p-4 text-sm leading-7 whitespace-pre-wrap',
                isError
                  ? 'border-destructive/18 bg-destructive/6 text-destructive/90'
                  : 'border-border/75 bg-muted/25 text-muted-foreground'
              )}
            >
              {state.detail}
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          {isAvailable ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {state.cancelText}
              </Button>
              <Button type="button" onClick={() => void onConfirmUpdate()}>
                {state.confirmText}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {state.dismissText ?? '关闭'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
