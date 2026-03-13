import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { ConfigItem } from './ConfigItem'
import { ConfigDialog } from './ConfigDialog'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { useConfigStore } from '@/hooks/use-config-store'
import { verifyConnection } from '@/services/verify-service'
import { MODEL_LABELS, type ModelId } from '@/types/config'
import { configStore } from '@/store/config-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MODELS: ModelId[] = ['nano-banana-pro', 'nano-banana-2']

function formatVerifyTime(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

/**
 * ����ϰ벿�֣�ģ��������
 */
export function ModelConfigSection() {
  const {
    configs,
    selectedConfigId,
    selectedModel,
    selectedConfig,
    setSelectedModel,
    setSelectedConfig,
    updateConfig,
    addConfig,
    deleteConfig
  } = useConfigStore()

  const [verifying, setVerifying] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<{ id: string; name: string } | null>(null)

  const handleVerify = async () => {
    if (!selectedConfig) return
    if (!selectedConfig.apiKey?.trim()) {
      toast.error('������д API Key')
      return
    }

    setVerifying(true)
    updateConfig(selectedConfig.id, { verifyStatus: 'verifying' })

    try {
      const result = await verifyConnection({
        apiKey: selectedConfig.apiKey,
        url: selectedConfig.url || undefined
      })

      updateConfig(selectedConfig.id, {
        verifyStatus: result.success ? 'success' : 'error',
        lastVerifiedAt: new Date().toISOString()
      })

      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      updateConfig(selectedConfig.id, { verifyStatus: 'error' })
      toast.error('��֤ʧ��')
    } finally {
      setVerifying(false)
    }
  }

  const handleAddConfig = (data: { name: string; apiKey: string; url: string; proModelNameOverride?: string; flashModelNameOverride?: string }) => {
    const name = data.name.trim() || configStore.getNextDefaultConfigName()
    addConfig({
      name,
      apiKey: data.apiKey,
      url: data.url,
      proModelNameOverride: data.proModelNameOverride ?? '',
      flashModelNameOverride: data.flashModelNameOverride ?? ''
    })
    toast.success('���������')
  }

  const handleEditConfig = (data: { name: string; apiKey: string; url: string; proModelNameOverride?: string; flashModelNameOverride?: string }) => {
    if (!selectedConfig) return
    updateConfig(selectedConfig.id, {
      name: data.name.trim() || selectedConfig.name,
      apiKey: data.apiKey,
      url: data.url,
      proModelNameOverride: data.proModelNameOverride ?? '',
      flashModelNameOverride: data.flashModelNameOverride ?? ''
    })
    toast.success('�����ѱ���')
    setEditOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">ģ��</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>{MODEL_LABELS[selectedModel]}</span>
              <span className="opacity-50">��</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
            {MODELS.map((id) => (
              <DropdownMenuItem key={id} onClick={() => setSelectedModel(id)}>
                {MODEL_LABELS[id]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">����</Label>
        <div className="flex flex-col gap-1">
          {configs.map((config) => (
            <ConfigItem
              key={config.id}
              config={config}
              isSelected={config.id === selectedConfigId}
              onSelect={() => setSelectedConfig(config.id)}
              onEdit={(cfg) => {
                setSelectedConfig(cfg.id)
                setEditOpen(true)
              }}
              onDelete={(cfg) => {
                setConfigToDelete({ id: cfg.id, name: cfg.name })
                setDeleteOpen(true)
              }}
            />
          ))}
        </div>
      </div>

      {selectedConfig && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <span className="block text-xs font-medium text-muted-foreground">
            ��ǰ���ã�{selectedConfig.name}
          </span>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {selectedConfig.verifyStatus === 'verifying' && (
              <>
                <span>��֤��...</span>
              </>
            )}
            {selectedConfig.verifyStatus !== 'verifying' && selectedConfig.lastVerifiedAt && (
              <>
                <span>�����֤��{formatVerifyTime(selectedConfig.lastVerifiedAt)}</span>
                {selectedConfig.verifyStatus === 'success' && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" aria-label="��֤�ɹ�" />
                )}
                {selectedConfig.verifyStatus === 'error' && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" aria-label="��֤ʧ��" />
                )}
              </>
            )}
            {selectedConfig.verifyStatus !== 'verifying' && !selectedConfig.lastVerifiedAt && (
              <span className="text-muted-foreground/70">δ��֤</span>
            )}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleVerify}
            disabled={verifying || !selectedConfig.apiKey?.trim()}
          >
            {verifying ? '��֤��...' : '��֤����'}
          </Button>
        </div>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={() => setAddOpen(true)}>
        ��������
      </Button>

      <ConfigDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        onConfirm={handleAddConfig}
        getDefaultName={() => configStore.getNextDefaultConfigName()}
      />
      <ConfigDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        config={selectedConfig}
        onConfirm={handleEditConfig}
      />
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o)
          if (!o) setConfigToDelete(null)
        }}
        title="ɾ������"
        description={configToDelete ? `ȷ��Ҫɾ�����á�${configToDelete.name}����` : ''}
        confirmText="ɾ��"
        cancelText="ȡ��"
        variant="destructive"
        onConfirm={() => {
          if (configToDelete) {
            deleteConfig(configToDelete.id)
            toast.success('��ɾ��')
          }
          setDeleteOpen(false)
          setConfigToDelete(null)
        }}
      />
    </div>
  )
}
