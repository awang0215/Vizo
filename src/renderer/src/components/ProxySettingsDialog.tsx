import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProxyConfig, ProxyMode } from '@/types/proxy'

interface ProxySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PROXY_MODES: { value: ProxyMode; label: string }[] = [
  { value: 'none', label: '不使用代理' },
  { value: 'system', label: '跟随系统代理' },
  { value: 'manual', label: '手动代理' }
]

export function ProxySettingsDialog({ open, onOpenChange }: ProxySettingsDialogProps) {
  const [proxyMode, setProxyMode] = useState<ProxyMode>('system')
  const [proxyHost, setProxyHost] = useState('')
  const [proxyPort, setProxyPort] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && typeof window?.electronAPI?.loadProxyConfig === 'function') {
      window.electronAPI.loadProxyConfig().then((config: ProxyConfig) => {
        setProxyMode(config.proxyMode)
        setProxyHost(config.proxyHost ?? '')
        setProxyPort(config.proxyPort ?? '')
      })
    }
  }, [open])

  const handleSave = async () => {
    if (proxyMode === 'manual' && (!proxyHost.trim() || !proxyPort.trim())) {
      toast.error('手动代理模式下请填写代理地址和端口')
      return
    }

    setSaving(true)
    try {
      if (typeof window?.electronAPI?.saveProxyConfig === 'function') {
        await window.electronAPI.saveProxyConfig({
          proxyMode,
          proxyHost: proxyHost.trim(),
          proxyPort: proxyPort.trim()
        })
        toast.success('代理设置已保存，验证连接和生成请求会立即使用新配置')
        onOpenChange(false)
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>代理设置</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm">代理模式</Label>
            <div className="flex flex-col gap-2">
              {PROXY_MODES.map((mode) => (
                <label key={mode.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="proxyMode"
                    checked={proxyMode === mode.value}
                    onChange={() => setProxyMode(mode.value)}
                    className="rounded-full"
                  />
                  <span className="text-sm">{mode.label}</span>
                </label>
              ))}
            </div>
          </div>

          {proxyMode === 'manual' && (
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label className="text-sm">代理地址</Label>
                <Input
                  placeholder="127.0.0.1"
                  value={proxyHost}
                  onChange={(event) => setProxyHost(event.target.value)}
                />
              </div>
              <div className="w-24 space-y-2">
                <Label className="text-sm">端口</Label>
                <Input
                  placeholder="7890"
                  value={proxyPort}
                  onChange={(event) => setProxyPort(event.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
