# MarkdownReader

一个基于 Electron 构建的精美 Windows Markdown 阅读器。

支持 GitHub 风格 Markdown 渲染、代码语法高亮、KaTeX 数学公式、Mermaid 图表、目录导航、明暗主题、多窗口对比等功能。

[English Documentation](docs/README.md)

## 功能特性

### Markdown 渲染

- 完整支持 GitHub 风格 Markdown（GFM），包括表格、任务列表、删除线、自动链接等
- 代码块语法高亮，支持 190+ 种编程语言
- 代码块右上角显示语言标签，悬停后出现一键复制按钮
- 行内代码与块级代码采用不同视觉样式，便于区分

### 数学公式

- 基于 KaTeX 实现高性能数学公式渲染
- 支持行内公式：用 `$` 包裹，例如 `$E = mc^2$`
- 支持块级公式：用 `$$` 包裹，例如：

```markdown
$$ \frac{n!}{k!(n-k)!} = \binom{n}{k} $$
```

- 支持 LaTeX 语法分隔符 \\(\\) 和 \\[\\]
- 渲染失败时不会中断页面，显示原始文本

### Mermaid 图表

- 支持流程图、时序图、甘特图、状态图、类图、ER 图等多种图表类型
- 主题切换时自动适配明暗配色
- 图表居中显示，支持缩放和导出

### 目录导航

- 左侧边栏自动生成文档目录树，层级缩进显示
- 滚动时通过 IntersectionObserver 实时高亮当前阅读位置的标题
- 目录支持模糊筛选，快速定位章节
- 可拖拽调整侧边栏宽度
- 快捷键 `Ctrl+Shift+C` 一键收起或展开

### 主题系统

- 内置亮色和暗色两种主题，平滑过渡切换
- 原生 Windows 标题栏（最小化/最大化/关闭按钮）颜色随主题自动适配
- 所有 UI 元素和代码高亮配色均完整支持双主题
- 快捷键 `Ctrl+Shift+T` 一键切换
- 主题选择自动持久化，下次启动恢复

### 多窗口支持

- 每个文件在独立窗口中打开，可并排对比不同文档
- 双击或右键打开新的 Markdown 文件时自动创建新窗口
- 菜单栏操作（缩放、主题、查找等）精准作用于当前聚焦窗口
- 快捷键 `Ctrl+Shift+N` 手动创建空白新窗口
- 快捷键 `Ctrl+W` 关闭当前窗口

### 查找功能

- 页内全文搜索，高亮所有匹配结果
- 上一个/下一个导航，当前匹配项特殊高亮
- 实时输入即时搜索，支持正则表达式转义
- 快捷键 `Ctrl+F` 打开查找栏，`Esc` 关闭

### 阅读体验

- 顶部阅读进度条，实时显示阅读位置百分比
- 状态栏显示文件名、字数统计、预计阅读时间
- 缩放支持 50% 到 300%，快捷键 `Ctrl+=` / `Ctrl+-` / `Ctrl+0`
- 鼠标悬停标题显示锚点链接，方便复制

### 文件管理

- 文件关联：安装后 `.md`、`.markdown`、`.mdown`、`.mkd` 文件自动关联
- 拖放打开：将文件直接拖入窗口即可加载
- 文件监听：文件在外部编辑器修改后自动刷新内容
- 最近文件：记录最近打开的 15 个文件，支持快速访问
- 重新加载：快捷键 `Ctrl+R` 重新读取当前文件

### 导出与打印

- 一键导出为 PDF，自动隐藏工具栏，优化打印排版
- 支持系统打印对话框

## 截图

![MarkdownReader](screenshot.png)

## 下载安装

1. 前往 [Releases](https://github.com/s-t-m/MarkdownReader/releases) 页面
2. 下载最新版 `MarkdownReader-Setup-x.x.x.exe`
3. 双击运行安装程序
4. 选择「为当前用户安装」或「为所有用户安装」
5. 可自定义安装目录
6. 安装完成后可选择立即启动

安装后 `.md` 等文件会自动关联到 MarkdownReader。也可以右键任意 Markdown 文件，选择「打开方式 -> MarkdownReader」。

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl+O` | 打开文件 |
| `Ctrl+R` | 重新加载文件 |
| `Ctrl+F` | 查找 |
| `Ctrl+=` | 放大 |
| `Ctrl+-` | 缩小 |
| `Ctrl+0` | 重置缩放 |
| `Ctrl+W` | 关闭窗口 |
| `Ctrl+Shift+T` | 切换主题 |
| `Ctrl+Shift+C` | 切换目录 |
| `Ctrl+Shift+N` | 新建窗口 |
| `Alt+F4` | 退出 |

## 开发指南

### 环境要求

- [Node.js](https://nodejs.org/) 18 或以上版本
- npm

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm start
```

启动后会自动构建渲染器包并打开 Electron 窗口。

### 构建渲染器包

```bash
npm run build:renderer
```

使用 esbuild 将 `marked`、`highlight.js`、`katex` 打包为单个 `dist/renderer.bundle.js` 文件。

### 打包安装程序

```bash
npm run dist
```

使用 electron-builder 打包 NSIS 安装程序，输出到 `release/` 目录。

## 技术栈

- [Electron](https://www.electronjs.org/) 31 - 跨平台桌面应用框架
- [esbuild](https://esbuild.github.io/) - JavaScript 打包工具
- [marked](https://marked.js.org/) - Markdown 解析器
- [highlight.js](https://highlightjs.org/) - 代码语法高亮
- [KaTeX](https://katex.org/) - 数学公式渲染
- [Mermaid](https://mermaid.js.org/) - 图表渲染
- [electron-builder](https://www.electron.build/) - 应用打包

## 项目结构

```
MarkdownReader/
├── main.js              # 主进程（多窗口管理、IPC 通信、菜单）
├── preload.js           # 预加载桥接（contextIsolation 安全）
├── build-renderer.js    # esbuild 打包脚本
├── src/
│   ├── index.html       # 应用 HTML 结构
│   ├── renderer.js      # 渲染进程逻辑
│   ├── styles.css       # 应用样式
│   ├── katex.css        # KaTeX 样式表
│   ├── mermaid.min.js   # Mermaid 图表库
│   ├── logo.png         # 应用 LOGO
│   └── fonts/           # KaTeX 字体文件（60 个）
├── build/
│   └── installer.nsh    # NSIS 自定义安装脚本
├── docs/
│   └── README.md        # 英文文档
├── MarkdownReader.ico   # 应用图标（多尺寸 ICO）
├── sample.md            # 示例文件
└── package.json         # 项目配置与构建元数据
```

## 工作原理

### 渲染流程

1. 主进程读取 Markdown 文件内容，通过 IPC 发送给渲染进程
2. 渲染进程使用 `marked` 解析 Markdown 为 HTML
3. 后处理阶段：
   - 解析图片和链接的相对路径，转换为绝对路径
   - 使用 `highlight.js` 高亮代码块
   - 使用 `KaTeX` 渲染数学公式
   - 使用 `Mermaid` 渲染图表
   - 从标题构建目录树
4. 文件监听器持续监控文件变化，外部修改后自动重新渲染

### 多窗口架构

每个文件在独立的 `BrowserWindow` 中打开，拥有独立的状态（文件监听器、当前路径等）。单实例锁确保第二次打开文件时创建新窗口而非替换当前窗口。所有 IPC 处理器通过 `BrowserWindow.fromWebContents()` 将操作路由到正确的窗口。

### 主题系统

应用通过 CSS 自定义属性（变量）实现主题切换。`<html>` 元素上的 `data-theme` 属性在亮色和暗色之间切换。原生标题栏按钮颜色通过 `setTitleBarOverlay()` 同步更新，与当前主题保持一致。

### 打包优化

- `marked`、`highlight.js`、`katex` 通过 esbuild 打包进 `renderer.bundle.js`，避免重复打包
- 仅包含运行时必需的文件（KaTeX CSS/字体、Mermaid JS）
- 过滤非必要的 Chromium 语言包（仅保留 `zh-CN` 和 `en-US`）
- NSIS 安装程序启用最大压缩

## 许可证

GPL-3.0
