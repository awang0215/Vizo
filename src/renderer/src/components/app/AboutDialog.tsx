import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: string
}

export function AboutDialog({ open, onOpenChange, version }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-border/85 bg-white p-0">
        <div className="border-b border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_46%),linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-6">
          <DialogHeader className="gap-3 text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-[0_14px_30px_rgba(59,130,246,0.28)]">
              V
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-[22px] font-semibold tracking-[0.01em]">
                Vizo
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                AI 生图 / 改图桌面工具
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-2xl border border-border/75 bg-white p-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/85">
              当前版本
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {version || '--'}
            </p>
          </div>

          <div className="rounded-2xl border border-border/75 bg-white p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              阿旺制作
              <br />
              用更顺手的本地工作流管理项目、提示词、图片素材与生成记录。
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border/70 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
