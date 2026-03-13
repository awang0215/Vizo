import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ConfigItem } from '@/components/left/ConfigItem'
import {
  ConfigSettingsDialog,
  type ConfigDialogData
} from '@/components/left/ConfigSettingsDialog'
import { useConfigStoreV2 } from '@/hooks/use-config-store-v2'
import { configStoreV2 } from '@/store/config-store-v2'

export function ConfigSection() {
  const {
    configs,
    selectedConfigId,
    addConfig,
    deleteConfig,
    setSelectedConfig,
    updateConfig
  } = useConfigStoreV2()

  const [addOpen, setAddOpen] = useState(false)
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)
  const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null)

  const editingConfig = useMemo(
    () => configs.find((config) => config.id === editingConfigId) ?? null,
    [configs, editingConfigId]
  )
  const configToDelete = useMemo(
    () => configs.find((config) => config.id === deleteConfigId) ?? null,
    [configs, deleteConfigId]
  )

  const handleAddConfig = (data: ConfigDialogData) => {
    addConfig({
      name: data.name.trim() || configStoreV2.getNextDefaultConfigName(),
      apiKey: data.apiKey,
      url: data.url,
      proModelNameOverride: data.proModelNameOverride ?? '',
      flashModelNameOverride: data.flashModelNameOverride ?? '',
      verifyStatus: data.verifyStatus,
      lastVerifiedAt: data.lastVerifiedAt
    })
    toast.success('配置已创建')
  }

  const handleEditConfig = (data: ConfigDialogData) => {
    if (!editingConfig) return

    updateConfig(editingConfig.id, {
      name: data.name.trim() || editingConfig.name,
      apiKey: data.apiKey,
      url: data.url,
      proModelNameOverride: data.proModelNameOverride ?? '',
      flashModelNameOverride: data.flashModelNameOverride ?? '',
      verifyStatus: data.verifyStatus,
      lastVerifiedAt: data.lastVerifiedAt
    })
    toast.success('配置已保存')
    setEditingConfigId(null)
  }

  const handleDeleteConfig = () => {
    if (!configToDelete) return

    deleteConfig(configToDelete.id)
    toast.success('配置已删除')
    setDeleteConfigId(null)
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {configs.length === 0 ? (
          <div className="empty-state-card">当前还没有配置，请先新建配置</div>
        ) : (
          configs.map((config) => (
            <ConfigItem
              key={config.id}
              config={config}
              isSelected={config.id === selectedConfigId}
              onSelect={() => setSelectedConfig(config.id)}
              onEdit={(currentConfig) => {
                setSelectedConfig(currentConfig.id)
                setEditingConfigId(currentConfig.id)
              }}
              onDelete={() => {
                setDeleteConfigId(config.id)
              }}
            />
          ))
        )}

        <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => setAddOpen(true)}>
          新建配置
        </Button>
      </div>

      <ConfigSettingsDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="add"
        getDefaultName={() => configStoreV2.getNextDefaultConfigName()}
        onConfirm={handleAddConfig}
      />

      <ConfigSettingsDialog
        open={!!editingConfig}
        onOpenChange={(open) => {
          if (!open) setEditingConfigId(null)
        }}
        mode="edit"
        config={editingConfig}
        onConfirm={handleEditConfig}
      />

      <AlertDialog
        open={!!configToDelete}
        onOpenChange={(open) => {
          if (!open) setDeleteConfigId(null)
        }}
        title="删除配置"
        description={
          configToDelete
            ? `确定要删除配置“${configToDelete.name}”吗？`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteConfig}
      />
    </>
  )
}
