import type { InputImage } from '@/types/input'

interface ImageThumbnailProps {
  image: InputImage
  onRemove: () => void
  onPreview: () => void
}

export function ImageThumbnail({ image, onRemove, onPreview }: ImageThumbnailProps) {
  return (
    <div className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-background/78 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <button
        type="button"
        className="absolute inset-0 flex items-center justify-center"
        onClick={onPreview}
      >
        <img
          src={image.previewUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        className="thumbnail-delete-btn h-[22px] w-[22px]"
        aria-label="删除图片"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  )
}
