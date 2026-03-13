# Vizo

基于 Electron-Vite + React + TypeScript + Tailwind CSS + Shadcn/UI 的 Windows 桌面应用。

## 环境要求

- Node.js 18+
- npm 或 pnpm

## 安装与运行

```bash
# 安装依赖
npm install

# 若 Electron 下载超时，可设置镜像后重试：
# Windows: set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
# 然后再次 npm install

# 启动开发环境
npm run dev
```

## 项目结构

```
Vizo/
├── src/
│   ├── main/              # Electron 主进程
│   │   └── index.ts        # 主进程入口
│   ├── preload/            # 预加载脚本
│   │   ├── index.ts        # preload 入口，IPC 桥接
│   │   └── index.d.ts      # 类型声明
│   └── renderer/           # 渲染进程 (React)
│       ├── index.html      # HTML 入口
│       └── src/
│           ├── main.tsx    # React 入口
│           ├── App.tsx     # 根组件
│           ├── index.css   # 全局样式
│           ├── components/
│           │   ├── ui/     # Shadcn/UI 基础组件
│           │   └── layout/ # 布局组件
│           └── lib/        # 工具函数
├── electron.vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 窗口入口与 IPC

| 类型 | 文件路径 |
|------|----------|
| 主进程入口 | `src/main/index.ts` |
| 渲染进程入口 | `src/renderer/index.html` → `src/renderer/src/main.tsx` |
| Preload 脚本 | `src/preload/index.ts` |
| IPC 桥接 | `src/preload/index.ts` 暴露 `window.electronAPI` |

## 布局与组件对应

| 区域 | 组件 | 用途 |
|------|------|------|
| 左侧 | `LeftPanel` | API、URL、验证、比例、分辨率等配置 |
| 中间上方 | `HistoryArea` | 历史记录展示 |
| 中间下方 | `InputArea` | 输入区 |
| 右侧 | `RightPanel` | 项目列表、新建项目 |
