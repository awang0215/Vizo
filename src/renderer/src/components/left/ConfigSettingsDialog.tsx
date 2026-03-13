import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { verifyConnection } from '@/services/verify-service'
import type { Config, VerifyStatus } from '@/types/config'

export interface ConfigDialogData {
  name: string
  apiKey: string
  url: string
  proModelNameOverride?: string
  flashModelNameOverride?: string
  verifyStatus: VerifyStatus
  lastVerifiedAt: string | null
}

interface ConfigSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  config?: Config | null
  onConfirm: (data: ConfigDialogData) => void
  getDefaultName?: () => string
}

function getVerifyButtonClass(status: VerifyStatus) {
  if (status === 'success') {
    return 'border-emerald-500/70 bg-emerald-500 text-white hover:bg-emerald-500/90 hover:text-white'
  }
  if (status === 'error') {
    return 'border-destructive/80 bg-destructive text-destructive-foreground hover:bg-destructive/92 hover:text-destructive-foreground'
  }
  return ''
}

function getVerifyLabel(status: VerifyStatus, verifying: boolean) {
  if (verifying || status === 'verifying') return '验证中...'
  if (status === 'success') return '通过'
  if (status === 'error') return '失败'
  return '验证'
}

export function ConfigSettingsDialog({
  open,
  onOpenChange,
  mode,
  config,
  onConfirm,
  getDefaultName
}: ConfigSettingsDialogProps) {
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [url, setUrl] = useState('')
  const [proModelNameOverride, setProModelNameOverride] = useState('')
  const [flashModelNameOverride, setFlashModelNameOverride] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle')
  const [lastVerifiedAt, setLastVerifiedAt] = useState<string | null>(null)
  const [lastVerifiedKey, setLastVerifiedKey] = useState('')
  const [verifying, setVerifying] = useState(false)

  const verifyKey = useMemo(
    () => `${apiKey.trim()}__${url.trim()}`,
    [apiKey, url]
  )

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && config) {
      setName(config.name)
      setApiKey(config.apiKey)
      setUrl(config.url)
      setProModelNameOverride(config.proModelNameOverride ?? '')
      setFlashModelNameOverride(config.flashModelNameOverride ?? '')
      setVerifyStatus(config.verifyStatus)
      setLastVerifiedAt(config.lastVerifiedAt)
      setLastVerifiedKey(`${config.apiKey.trim()}__${config.url.trim()}`)
      return
    }

    setName('')
    setApiKey('')
    setUrl('')
    setProModelNameOverride('')
    setFlashModelNameOverride('')
    setVerifyStatus('idle')
    setLastVerifiedAt(null)
    setLastVerifiedKey('')
  }, [open, mode, config])

  useEffect(() => {
    if (!open || verifying) return
    if (!lastVerifiedKey || verifyKey === lastVerifiedKey) return

    setVerifyStatus('idle')
    setLastVerifiedAt(null)
  }, [open, verifying, verifyKey, lastVerifiedKey])

  const handleVerify = async () => {
    const trimmedApiKey = apiKey.trim()
    if (!trimmedApiKey) {
      toast.error('请先填写 API Key')
      return
    }

    setVerifying(true)
    setVerifyStatus('verifying')

    try {
      const result = await verifyConnection({
        apiKey: trimmedApiKey,
        url: url.trim() || undefined
      })

      const nextStatus: VerifyStatus = result.success ? 'success' : 'error'
      const nextVerifiedAt = new Date().toISOString()

      setVerifyStatus(nextStatus)
      setLastVerifiedAt(nextVerifiedAt)
      setLastVerifiedKey(`${trimmedApiKey}__${url.trim()}`)

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      setVerifyStatus('error')
      setLastVerifiedAt(null)
      toast.error(error instanceof Error ? error.message : '验证失败')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = () => {
    const trimmedApiKey = apiKey.trim()
    if (!trimmedApiKey) return

    const finalName =
      name.trim() ||
      (mode === 'add' ? getDefaultName?.() ?? '配置' : config?.name ?? '配置')

    onConfirm({
      name: finalName,
      apiKey: trimmedApiKey,
      url: url.trim(),
      proModelNameOverride: proModelNameOverride.trim() || undefined,
      flashModelNameOverride: flashModelNameOverride.trim() || undefined,
      verifyStatus: verifyKey === lastVerifiedKey ? verifyStatus : 'idle',
      lastVerifiedAt: verifyKey === lastVerifiedKey ? lastVerifiedAt : null
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '新建配置' : '编辑配置'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="config-name">名称</Label>
            <Input
              id="config-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={mode === 'add' ? '不填则自动命名为配置 N' : ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config-api-key">
              API Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="config-api-key"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="必填"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config-url">URL（可选，留空则使用官方默认）</Label>
            <Input
              id="config-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="可选"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config-pro-model">Pro 模型名覆盖（可选）</Label>
            <Input
              id="config-pro-model"
              value={proModelNameOverride}
              onChange={(event) => setProModelNameOverride(event.target.value)}
              placeholder="留空则使用默认官方模型名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config-flash-model">Banana 2 模型名覆盖（可选）</Label>
            <Input
              id="config-flash-model"
              value={flashModelNameOverride}
              onChange={(event) => setFlashModelNameOverride(event.target.value)}
              placeholder="留空则使用默认官方模型名"
            />
          </div>

          <p className="rounded-lg bg-muted/45 px-3 py-2 text-xs leading-5 text-muted-foreground">
            当你修改 API Key 或 URL 后，验证状态会自动复位，避免旧结果误导。
          </p>
        </div>

        <DialogFooter className="items-center justify-between gap-2 sm:justify-between sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            className={cn('min-w-20', getVerifyButtonClass(verifyStatus))}
            onClick={handleVerify}
            disabled={verifying || !apiKey.trim()}
          >
            {getVerifyLabel(verifyStatus, verifying)}
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!apiKey.trim()}>
              确认
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
