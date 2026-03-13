# Vizo 构建说明

## 生成 Windows 安装包

```bash
npm run build:win
```

产物位于 `release/` 目录：

- `Vizo-0.1.0-Setup.exe` - NSIS 安装器
- `win-unpacked/` - 解压后的应用目录（可直接运行 Vizo.exe）

**当前为未签名构建**，安装时 Windows 可能提示“未知发布者”，属正常现象。

---

## 自定义图标

将图标文件放入 `build/` 目录：

| 文件 | 用途 |
|------|------|
| `build/icon.png` | 应用图标（推荐 256×256，electron-builder 会转为 .ico） |
| `build/icon.ico` | 也可直接使用 .ico，优先于 .png |

图标生效位置：应用 exe、安装器、桌面快捷方式、窗口标题栏/任务栏。

若未放置图标，将使用 Electron 默认图标，构建和开发不受影响。

---

## 代码签名（预留）

当前 `build:win` 已跳过签名，本地构建可正常完成。

若需正式签名，请：

1. 准备 Windows 代码签名证书（.pfx 或 .p12）
2. 设置环境变量后执行 `npm run build:win:signed`：

```bash
# 证书文件路径（本地路径或 URL）
set CSC_LINK=path/to/your-certificate.pfx

# 证书密码
set CSC_KEY_PASSWORD=your-password

# 可选：证书名称
set CSC_NAME="Your Company Name"

npm run build:win:signed
```

未设置上述变量时，`build:win:signed` 会尝试自动发现证书；若无证书，构建可能失败，此时请使用 `build:win`。

---

## 安装包特性

- 标准 Windows 安装向导
- 安装时创建桌面快捷方式
- 支持选择安装目录
- 可通过「设置 → 应用」或「控制面板 → 程序和功能」卸载

---

## 注意事项

- 当前使用 electron-builder 24.6.3 以兼容 Windows 构建环境
- 若使用新版 electron-builder 出现符号链接错误，可尝试：
  - 以管理员身份运行终端
  - 或启用 Windows 开发者模式
