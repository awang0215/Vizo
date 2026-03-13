import { ImageUploadCard } from './ImageUploadCard'
import { ImageThumbnail } from './ImageThumbnail'
import { inputStore } from '@/store/input-store'
import { useInputStore } from '@/hooks/use-input-store'

/**
 * �������²㣺ͼƬ�ϴ� + ����ͼ
 * ֧�֣�����ϴ�����ק��ճ���� InputArea ͳһ�����
 */
export function ImageUploadSection() {
  const { inputImages, removeImage } = useInputStore()

  return (
    <div className="flex items-start gap-2">
      <ImageUploadCard imageCount={inputImages.length} />
      <div className="app-scrollbar flex max-w-full flex-1 flex-wrap gap-2 overflow-y-auto pr-1">
        {inputImages.map((img) => (
          <ImageThumbnail
            key={img.id}
            image={img}
            onRemove={() => removeImage(img.id)}
            onPreview={() =>
              inputStore.openPreview(
                inputImages.map((i) => ({ id: i.id, url: i.previewUrl })),
                inputImages.findIndex((i) => i.id === img.id),
                'input'
              )
            }
          />
        ))}
      </div>
    </div>
  )
}
