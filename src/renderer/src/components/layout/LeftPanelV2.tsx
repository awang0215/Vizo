import type { ReactNode } from 'react'
import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfigSection } from '@/components/left/ConfigSection'
import { GenerationParamsSection } from '@/components/left/GenerationParamsSection'
import { ModelSection } from '@/components/left/ModelSection'
import { FileLibraryPanel } from '@/components/right/FileLibraryPanel'
import { cn } from '@/lib/utils'

type LeftPanelTab = 'files' | 'settings'

interface PanelSectionProps {
  title: string
  children: ReactNode
}

function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <section className="section-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-title">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function SettingsPanelContent() {
  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-4 p-4">
        <PanelSection title="模型">
          <ModelSection />
        </PanelSection>

        <PanelSection title="配置">
          <ConfigSection />
        </PanelSection>

        <PanelSection title="功能">
          <GenerationParamsSection />
        </PanelSection>
      </div>
    </ScrollArea>
  )
}

export function LeftPanelV2() {
  const [activeTab, setActiveTab] = useState<LeftPanelTab>('files')

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border/80 bg-muted/35">
      <div className="shrink-0 border-b border-border/80 bg-background/70 p-3 backdrop-blur">
        <div className="grid grid-cols-2 rounded-xl border border-border/80 bg-background/72 p-1 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          {([
            ['files', '文件'],
            ['settings', '设置']
          ] as const).map(([value, label]) => {
            const active = activeTab === value

            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-background text-foreground shadow-[0_4px_14px_rgba(15,23,42,0.08)]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === 'files' ? <FileLibraryPanel /> : <SettingsPanelContent />}
      </div>
    </aside>
  )
}
