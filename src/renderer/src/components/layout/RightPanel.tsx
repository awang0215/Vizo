import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ProjectItem } from '@/components/project/ProjectItem'
import { useProjectStore } from '@/hooks/use-project-store'
import { createNewProject } from '@/services/project-service'
import { deleteProjectById } from '@/services/project-service'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { projectStore } from '@/store/project-store'
import { toast } from 'sonner'

/**
 * �Ҳ���Ŀ��
 * ��Ŀ�б���½���ɾ����ѡ��
 */
export function RightPanel() {
  const { projects, selectedProjectId } = useProjectStore()
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const result = await createNewProject()
      if (result.success) {
        toast.success('�Ѵ�������Ŀ')
      } else if (result.error) {
        toast.error(result.error)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleSelect = (id: string) => {
    projectStore.setSelectedProject(id)
  }

  const handleDeleteClick = (id: string) => {
    setDeleteProjectId(id)
  }

  const handleDeleteConfirm = async () => {
    const id = deleteProjectId
    if (!id) return
    const result = await deleteProjectById(id)
    setDeleteProjectId(null)
    if (result.success) {
      toast.success('��Ŀ��ɾ��')
    } else if (result.error) {
      toast.error(result.error)
    }
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-l border-border bg-muted/30">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <h2 className="text-sm font-semibold text-foreground">��Ŀ</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCreate}
          disabled={creating}
        >
          {creating ? '������...' : '�½���Ŀ'}
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            ������Ŀ������ͼƬʱ���Զ�����
          </p>
        ) : (
          projects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              isSelected={project.id === selectedProjectId}
              onSelect={() => handleSelect(project.id)}
              onDelete={() => handleDeleteClick(project.id)}
            />
          ))
        )}
      </div>

      <AlertDialog
        open={!!deleteProjectId}
        onOpenChange={(open) => !open && setDeleteProjectId(null)}
        title="ɾ����Ŀ"
        description="ȷ��Ҫɾ������Ŀ�𣿽�ͬʱɾ������Ŀ�µ�ȫ����ʷ��¼�ͻ���ͼƬ���˲������ɻָ���"
        confirmText="ɾ��"
        cancelText="ȡ��"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </aside>
  )
}
