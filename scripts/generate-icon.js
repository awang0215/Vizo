#!/usr/bin/env node
/**
 * 从 build/icon.png 生成 build/icon.ico
 * Windows 需要 .ico 格式才能正确显示 exe 和快捷方式图标
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(__dirname, '../build')
const pngPath = path.join(buildDir, 'icon.png')
const icoPath = path.join(buildDir, 'icon.ico')

if (!fs.existsSync(pngPath)) {
  console.warn('[generate-icon] build/icon.png 不存在，跳过')
  process.exit(0)
}

;(async () => {
  try {
    const { default: pngToIco } = await import('png-to-ico')
    const buf = await pngToIco(pngPath)
    fs.writeFileSync(icoPath, buf)
    console.log('[generate-icon] 已生成 build/icon.ico')
  } catch (err) {
    console.error('[generate-icon] 生成失败:', err.message)
    process.exit(1)
  }
})()
