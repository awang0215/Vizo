const path = require('path')
const fs = require('fs')

const buildDir = path.join(__dirname, 'build')
const iconIco = path.join(buildDir, 'icon.ico')
const iconPng = path.join(buildDir, 'icon.png')
const hasIco = fs.existsSync(iconIco)
const hasPng = fs.existsSync(iconPng)
const iconFile = hasIco ? 'icon.ico' : hasPng ? 'icon.png' : null

if (!iconFile) {
  console.warn('[electron-builder] 未找到 build/icon.ico 或 build/icon.png，将使用默认图标')
}

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.awang.vizo',
  productName: 'Vizo',
  copyright: '阿旺制作',

  directories: {
    output: 'release',
    buildResources: 'build'
  },

  files: [
    '!**/.vscode/*',
    '!.electron-user-data/**',
    '!release/**',
    '!docs/**',
    '!scripts/**',
    '!src/*',
    '!electron.vite.config.{js,ts,mjs,cjs}',
    '!{.eslintignore,.eslintrc*,prettier*,CHANGELOG.md,README.md}',
    '!{.env,.env.*,.npmrc}',
    '!{tsconfig*.json}',
    '!figma-static.err',
    '!**/*.log',
    '!**/tmp/**',
    '!**/temp/**'
  ],

  win: {
    ...(iconFile && { icon: iconFile }),
    ...(process.env.CI ? { signAndEditExecutable: false } : {}),
    forceCodeSigning: false,
    sign: null,
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    executableName: 'Vizo'
  },

  nsis: {
    artifactName: '${productName}-${version}-Setup.${ext}',
    shortcutName: 'Vizo',
    uninstallDisplayName: 'Vizo',
    ...(iconFile && {
      installerIcon: iconFile,
      uninstallerIcon: iconFile
    }),
    installerLanguages: ['zh_CN'],
    createDesktopShortcut: 'always',
    createStartMenuShortcut: false,
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    deleteAppDataOnUninstall: false,
    include: 'build/uninstaller-history-cleanup-safe.nsh'
  }
}
