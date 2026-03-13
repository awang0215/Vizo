import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModelConfigSection } from '@/components/left/ModelConfigSection'
import { GenerationParamsSection } from '@/components/left/GenerationParamsSection'

/**
 * ����������
 * �ϰ룺ģ��������
 * �°룺���ɲ������������ֱ��ʣ�
 */
export function LeftPanel() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <h2 className="text-sm font-semibold text-foreground">����</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          <ModelConfigSection />
          <Separator />
          <GenerationParamsSection />
        </div>
      </ScrollArea>
    </aside>
  )
}
