import { useState } from 'react'
import { toast } from 'sonner'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ProjectItem } from '@/components/project/ProjectItem'
import { PromptPresetSection } from '@/components/right/PromptPresetSection'
import { useProjectStore } from '@/hooks/use-project-store'
import { createNewProject, deleteProjectById } from '@/services/project-service'
import { projectStore } from '@/store/project-store'

export function RightPanelV2() {
  const { projects, selectedProjectId } = useProjectStore()
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleCreateProject = async () => {
    setCreating(true)
    try {
      const result = await createNewProject()
      if (result.success) {
        toast.success('已创建新项目')
      } else if (result.error) {
        toast.error(result.error)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return

    const result = await deleteProjectById(deleteProjectId)
    setDeleteProjectId(null)

    if (result.success) {
      toast.success('项目已删除')
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border/80 bg-muted/35">
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <section className="section-card flex min-h-0 flex-1 flex-col p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="section-title">项目</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCreateProject}
              disabled={creating}
            >
              {creating ? '创建中...' : '新建项目'}
            </Button>
          </div>

          <div className="app-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <div className="empty-state-card">暂无项目，生成图片时将自动创建</div>
            ) : (
              projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isSelected={project.id === selectedProjectId}
                  onSelect={() => projectStore.setSelectedProject(project.id)}
                  onDelete={() => setDeleteProjectId(project.id)}
                />
              ))
            )}
          </div>
        </section>

        <PromptPresetSection />
      </div>

      <AlertDialog
        open={!!deleteProjectId}
        onOpenChange={(open) => {
          if (!open) setDeleteProjectId(null)
        }}
        title="删除项目"
        description="确定要删除这个项目吗？这会同时删除该项目下的历史记录和缓存图片，此操作不可恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={handleDeleteProject}
      />
    </aside>
  )
}
