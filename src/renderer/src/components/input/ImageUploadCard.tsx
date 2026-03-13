import { useRef } from 'react'
import { inputStore } from '@/store/input-store'
import { MAX_IMAGES } from '@/utils/image-input-validate-safe'
import { cn } from '@/lib/utils'

interface ImageUploadCardProps {
  imageCount: number
  onPick?: () => void
}

const ACCEPT = 'image/png,image/jpg,image/jpeg,image/webp'

export function ImageUploadCard({ imageCount, onPick }: ImageUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (imageCount >= MAX_IMAGES) return
    inputRef.current?.click()
  }

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return
    await inputStore.addImages(Array.from(files))
    onPick?.()
    event.target.value = ''
  }

  const atLimit = imageCount >= MAX_IMAGES

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={atLimit}
        className={cn(
          'flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed text-muted-foreground transition-all duration-150',
          atLimit
            ? 'cursor-not-allowed border-border/70 bg-muted/40 text-muted-foreground/70'
            : 'border-border/90 bg-background/78 shadow-[0_1px_2px_rgba(15,23,42,0.03)] hover:border-primary/35 hover:bg-accent/55 hover:text-foreground'
        )}
        title={atLimit ? `已达上限 ${MAX_IMAGES} 张` : '点击上传图片'}
      >
        <span className="text-lg leading-none">+</span>
      </button>
    </>
  )
}
