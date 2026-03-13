/**
 * File ת data URL������ img src ��ʾ��Electron �б� blob URL ���ɿ���
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * File ת base64����������ͼƬ����
 */
export function fileToBase64(file: File): Promise<{ mimeType: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const [header, data] = result.split(',')
      const mimeMatch = header.match(/data:(.*?);/)
      const mimeType = mimeMatch?.[1] ?? 'image/png'
      resolve({ mimeType, base64: data ?? '' })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
