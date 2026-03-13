import { Label } from '@/components/ui/label'
import { useInputStore } from '@/hooks/use-input-store'
import type { AspectRatio, OutputCount, ResolutionPreset } from '@/types/input'
import { cn } from '@/lib/utils'

const RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
  { value: '3:4', label: '3:4' },
  { value: '4:3', label: '4:3' },
  { value: '21:9', label: '21:9' }
]

const RESOLUTIONS: { value: ResolutionPreset; label: string }[] = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' }
]

const OUTPUT_COUNTS: { value: OutputCount; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 8, label: '8' }
]

function OptionChip({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150',
        active
          ? 'border-primary/35 bg-primary/10 text-primary shadow-[0_6px_16px_rgba(59,130,246,0.12)]'
          : 'border-input/90 bg-background/80 text-foreground/88 hover:bg-accent/70'
      )}
    >
      {children}
    </button>
  )
}

export function GenerationParamsSection() {
  const {
    aspectRatio,
    resolutionPreset,
    outputCount,
    setAspectRatio,
    setResolutionPreset,
    setOutputCount
  } = useInputStore()

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2.5">
        <Label className="section-caption not-italic normal-case tracking-[0.04em]">图片比例</Label>
        <div className="flex flex-wrap gap-2">
          {RATIOS.map((ratio) => (
            <OptionChip
              key={ratio.value}
              active={aspectRatio === ratio.value}
              onClick={() => setAspectRatio(ratio.value)}
            >
              {ratio.label}
            </OptionChip>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="section-caption not-italic normal-case tracking-[0.04em]">分辨率</Label>
        <div className="flex flex-wrap gap-2">
          {RESOLUTIONS.map((resolution) => (
            <OptionChip
              key={resolution.value}
              active={resolutionPreset === resolution.value}
              onClick={() => setResolutionPreset(resolution.value)}
            >
              {resolution.label}
            </OptionChip>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <Label className="section-caption not-italic normal-case tracking-[0.04em]">输出数量</Label>
        <div className="flex flex-wrap gap-2">
          {OUTPUT_COUNTS.map((count) => (
            <OptionChip
              key={count.value}
              active={outputCount === count.value}
              onClick={() => setOutputCount(count.value)}
            >
              {count.label}
            </OptionChip>
          ))}
        </div>
      </div>
    </div>
  )
}
