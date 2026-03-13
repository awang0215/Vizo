export interface VerifyParams {
  apiKey: string
  url?: string
}

export interface VerifyResult {
  success: boolean
  message: string
}

export async function verifyConnection(params: VerifyParams): Promise<VerifyResult> {
  if (typeof window?.electronAPI?.verifyConnection !== 'function') {
    return { success: false, message: 'Electron API 不可用' }
  }
  return window.electronAPI.verifyConnection(params)
}
