import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MODEL_LABELS, type ModelId } from '@/types/config'
import { useConfigStoreV2 } from '@/hooks/use-config-store-v2'

const MODELS: ModelId[] = ['nano-banana-pro', 'nano-banana-2']

export function ModelSection() {
  const { selectedModel, setSelectedModel } = useConfigStoreV2()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-10 w-full justify-between px-3.5">
          <span className="truncate">{MODEL_LABELS[selectedModel]}</span>
          <span className="text-xs text-muted-foreground">v</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {MODELS.map((modelId) => (
          <DropdownMenuItem key={modelId} onClick={() => setSelectedModel(modelId)}>
            {MODEL_LABELS[modelId]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
