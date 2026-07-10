# MarkdownReader

A beautiful Windows Markdown reader built with Electron. Supports GitHub-flavored Markdown, syntax highlighting, KaTeX math formulas, Mermaid diagrams, table of contents, and more.

一个基于 Electron 构建的精美 Windows Markdown 阅读器。支持 GitHub 风格 Markdown、语法高亮、KaTeX 数学公式、Mermaid 图表、目录导航等。

---

## Features / 功能特性

- GitHub-flavored Markdown rendering / GitHub 风格 Markdown 渲染
- Syntax highlighting (highlight.js) / 语法高亮
- KaTeX math formula support (inline & block) / 数学公式支持（行内与块级）
- Mermaid diagram rendering / Mermaid 图表渲染
- Table of contents with active heading tracking / 目录导航与标题高亮追踪
- Light / Dark theme with native title bar integration / 明暗主题，原生标题栏适配
- Multi-window support for file comparison / 多窗口支持，方便文件对比
- Find in page / 页内查找
- Reading progress bar / 阅读进度条
- File watcher (auto-reload on change) / 文件监听（修改后自动刷新）
- Zoom controls / 缩放控制
- Export to PDF / 导出 PDF
- Drag & drop to open files / 拖放打开文件
- File association (.md, .markdown, .mdown, .mkd) / 文件关联
- Recent files list / 最近文件列表

## Screenshots / 截图

![MarkdownReader](screenshot.png)

## Download & Install / 下载安装

1. Go to [Releases](https://github.com/s-t-m/MarkdownReader/releases) / 前往 [Releases](https://github.com/s-t-m/MarkdownReader/releases) 下载
2. Download `MarkdownReader-Setup-1.0.0.exe` / 下载 `MarkdownReader-Setup-1.0.0.exe`
3. Run the installer / 运行安装程序
4. Choose per-user or per-machine installation / 选择为当前用户或所有用户安装

After installation, `.md` files will be associated with MarkdownReader automatically. / 安装后 `.md` 文件将自动关联到 MarkdownReader。

## Keyboard Shortcuts / 快捷键

| Shortcut / 快捷键 | Action / 功能 |
|---|---|
| `Ctrl+O` | Open file / 打开文件 |
| `Ctrl+R` | Reload file / 重新加载文件 |
| `Ctrl+F` | Find / 查找 |
| `Ctrl+=` | Zoom in / 放大 |
| `Ctrl+-` | Zoom out / 缩小 |
| `Ctrl+0` | Reset zoom / 重置缩放 |
| `Ctrl+W` | Close window / 关闭窗口 |
| `Ctrl+Shift+T` | Toggle theme / 切换主题 |
| `Ctrl+Shift+C` | Toggle table of contents / 切换目录 |
| `Ctrl+Shift+N` | New window / 新建窗口 |
| `Alt+F4` | Exit / 退出 |

## Development / 开发

### Prerequisites / 前置要求

- [Node.js](https://nodejs.org/) 18+
- npm

### Install dependencies / 安装依赖

```bash
npm install
```

### Run in development / 开发模式运行

```bash
npm start
```

### Build renderer bundle / 构建渲染器包

```bash
npm run build:renderer
```

### Package for Windows / 打包 Windows 安装程序

```bash
npm run dist
```

The installer will be output to `release/MarkdownReader-Setup-1.0.0.exe`. / 安装程序将输出到 `release/MarkdownReader-Setup-1.0.0.exe`。

## Tech Stack / 技术栈

- [Electron](https://www.electronjs.org/) 31
- [esbuild](https://esbuild.github.io/) for bundling
- [marked](https://marked.js.org/) for Markdown parsing
- [highlight.js](https://highlightjs.org/) for syntax highlighting
- [KaTeX](https://katex.org/) for math rendering
- [Mermaid](https://mermaid.js.org/) for diagrams
- [electron-builder](https://www.electron.build/) for packaging

## Project Structure / 项目结构

```
MarkdownReader/
├── main.js              # Main process (multi-window) / 主进程（多窗口）
├── preload.js           # Preload bridge / 预加载桥接
├── build-renderer.js    # esbuild bundler / 渲染器打包脚本
├── src/
│   ├── index.html       # App HTML / 应用 HTML
│   ├── renderer.js      # Renderer logic / 渲染器逻辑
│   ├── styles.css       # App styles / 应用样式
│   ├── katex.css        # KaTeX styles / KaTeX 样式
│   ├── mermaid.min.js   # Mermaid library / Mermaid 库
│   ├── logo.png         # App logo / 应用图标
│   └── fonts/           # KaTeX fonts / KaTeX 字体
├── build/
│   └── installer.nsh    # NSIS custom script / NSIS 自定义脚本
├── MarkdownReader.ico   # App icon / 应用图标
└── package.json
```

## License / 许可证

MIT
