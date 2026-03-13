import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Config } from '@/types/config'

interface ConfigDialogData {
  name: string
  apiKey: string
  url: string
  proModelNameOverride?: string
  flashModelNameOverride?: string
}

interface ConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  config?: Config | null
  onConfirm: (data: ConfigDialogData) => void
  getDefaultName?: () => string
}

export function ConfigDialog({
  open,
  onOpenChange,
  mode,
  config,
  onConfirm,
  getDefaultName
}: ConfigDialogProps) {
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [url, setUrl] = useState('')
  const [proModelNameOverride, setProModelNameOverride] = useState('')
  const [flashModelNameOverride, setFlashModelNameOverride] = useState('')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && config) {
        setName(config.name)
        setApiKey(config.apiKey)
        setUrl(config.url)
        setProModelNameOverride(config.proModelNameOverride ?? '')
        setFlashModelNameOverride(config.flashModelNameOverride ?? '')
      } else {
        setName('')
        setApiKey('')
        setUrl('')
        setProModelNameOverride('')
        setFlashModelNameOverride('')
      }
    }
  }, [open, mode, config])

  const handleSubmit = () => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey) return
    const finalName = name.trim() || (mode === 'add' ? (getDefaultName?.() ?? '����') : config?.name ?? '����')
    onConfirm({
      name: finalName,
      apiKey: trimmedKey,
      url: url.trim(),
      proModelNameOverride: proModelNameOverride.trim() || undefined,
      flashModelNameOverride: flashModelNameOverride.trim() || undefined
    })
    onOpenChange(false)
  }

  const title = mode === 'add' ? '��������' : '�༭����'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>����</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={mode === 'add' ? '������Ĭ������Ϊ����N' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label>API Key <span className="text-destructive">*</span></Label>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="����"
              type="password"
            />
          </div>
          <div className="space-y-2">
            <Label>URL����ѡ������ʹ�ùٷ�Ĭ�ϣ�</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="��ѡ"
            />
          </div>
          <div className="space-y-2">
            <Label>Pro ģ�������ǣ���ѡ��</Label>
            <Input
              value={proModelNameOverride}
              onChange={(e) => setProModelNameOverride(e.target.value)}
              placeholder="�����ʹ��Ĭ�Ϲٷ�ģ����"
            />
          </div>
          <div className="space-y-2">
            <Label>Banana 2 ģ�������ǣ���ѡ��</Label>
            <Input
              value={flashModelNameOverride}
              onChange={(e) => setFlashModelNameOverride(e.target.value)}
              placeholder="�����ʹ��Ĭ�Ϲٷ�ģ����"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ȡ��
          </Button>
          <Button onClick={handleSubmit} disabled={!apiKey.trim()}>
            ȷ��
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
