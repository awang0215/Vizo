export type ProxyMode = 'none' | 'system' | 'manual'

export interface ProxyConfig {
  proxyMode: ProxyMode
  proxyHost: string
  proxyPort: string
}
