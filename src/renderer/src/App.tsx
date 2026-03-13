import { useEffect, useState } from 'react'
import { LeftPanelV2 } from '@/components/layout/LeftPanelV2'
import { MiddlePanel } from '@/components/layout/MiddlePanel'
import { RightPanelV2 } from '@/components/layout/RightPanelV2'
import { ImagePreviewModal } from '@/components/input/ImagePreviewModal'
import { ProxySettingsDialog } from '@/components/ProxySettingsDialog'
import { AboutDialog } from '@/components/app/AboutDialog'
import { UpdateDialog, type UpdateDialogState } from '@/components/app/UpdateDialog'
import { configStoreV2 } from '@/store/config-store-v2'
import { projectStore } from '@/store/project-store'
import { historyStore } from '@/store/history-store'
import { toast } from 'sonner'

function App() {
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false)
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [updateDialogState, setUpdateDialogState] = useState<UpdateDialogState | null>(null)

  useEffect(() => {
    configStoreV2.load()
    void Promise.all([projectStore.load(), historyStore.load()])
    void window.electronAPI
      .getAppVersion()
      .then((version) => setAppVersion(version))
      .catch(() => setAppVersion(''))
  }, [])

  useEffect(() => {
    if (typeof window?.electronAPI?.on !== 'function') return

    const unsubProxy = window.electronAPI.on('proxy:openSettings', () => {
      setProxyDialogOpen(true)
    })

    const unsubAbout = window.electronAPI.on('app:openAbout', () => {
      setAboutDialogOpen(true)
    })

    const unsubUpdateDialog = window.electronAPI.on('update:dialog', (payload: unknown) => {
      setUpdateDialogState(payload as UpdateDialogState)
    })

    return () => {
      unsubProxy()
      unsubAbout()
      unsubUpdateDialog()
    }
  }, [])

  useEffect(() => {
    if (typeof window?.electronAPI?.on !== 'function') return

    const unsubOutputChanged = window.electronAPI.on(
      'output-dir:changed',
      (result: { success?: boolean; error?: string }) => {
        if (result.success) {
          toast.success('输出目录已修改，图片已迁移')
          historyStore.load()
          projectStore.load()
        } else if (result.error) {
          toast.error(`修改输出目录失败：${result.error}`)
        }
      }
    )

    const unsubOutputError = window.electronAPI.on('output-dir:error', (message: string) => {
      toast.error(`打开输出目录失败：${message}`)
    })

    const unsubInputChanged = window.electronAPI.on(
      'input-dir:changed',
      (result: { success?: boolean; error?: string }) => {
        if (result.success) {
          toast.success('输入目录已修改，图片已迁移')
          historyStore.load()
        } else if (result.error) {
          toast.error(`修改输入目录失败：${result.error}`)
        }
      }
    )

    const unsubInputError = window.electronAPI.on('input-dir:error', (message: string) => {
      toast.error(`打开输入目录失败：${message}`)
    })

    return () => {
      unsubOutputChanged()
      unsubOutputError()
      unsubInputChanged()
      unsubInputError()
    }
  }, [])

  const handleUpdateDialogOpenChange = (open: boolean) => {
    if (!open) {
      setUpdateDialogState(null)
    }
  }

  const handleConfirmUpdate = async () => {
    await window.electronAPI.downloadUpdate()
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <LeftPanelV2 />
      <MiddlePanel />
      <RightPanelV2 />
      <ImagePreviewModal />
      <ProxySettingsDialog open={proxyDialogOpen} onOpenChange={setProxyDialogOpen} />
      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} version={appVersion} />
      <UpdateDialog
        state={updateDialogState}
        onOpenChange={handleUpdateDialogOpenChange}
        onConfirmUpdate={handleConfirmUpdate}
      />
    </div>
  )
}

export default App
