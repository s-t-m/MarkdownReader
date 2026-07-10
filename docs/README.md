# MarkdownReader

A beautiful Windows Markdown reader built with Electron.

## Features

- **GitHub-flavored Markdown** rendering with tables, task lists, strikethrough, and more
- **Syntax highlighting** powered by highlight.js with language labels and copy buttons
- **KaTeX math formulas** supporting both inline (`$E=mc^2$`) and block-level (`$$...$$`) equations
- **Mermaid diagrams** including flowcharts, sequence diagrams, Gantt charts, state diagrams, etc.
- **Table of contents** sidebar with active heading tracking via IntersectionObserver
- **Light & Dark themes** with native Windows title bar overlay integration
- **Multi-window support** 鈥?open multiple files in separate windows for side-by-side comparison
- **Find in page** with match highlighting and navigation
- **Reading progress bar** that tracks scroll position
- **File watcher** 鈥?automatically reloads when the file changes on disk
- **Zoom controls** from 50% to 300%
- **Export to PDF** with print-optimized layout
- **Drag & drop** files directly into the window
- **File association** for `.md`, `.markdown`, `.mdown`, and `.mkd` extensions
- **Recent files** list with quick access
- **Sidebar resizer** for adjusting TOC width
- **TOC filter** to search headings
- **Keyboard shortcuts** for all common actions

## Screenshots

![MarkdownReader](screenshot.png)

## Download & Install

1. Go to [Releases](https://github.com/s-t-m/MarkdownReader/releases)
2. Download `MarkdownReader-Setup-1.0.1.exe`
3. Run the installer
4. Choose per-user or per-machine installation
5. Optionally change the installation directory

After installation, `.md` files will be associated with MarkdownReader automatically. You can also right-click any Markdown file and choose "Open with 鈫?MarkdownReader".

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+O` | Open file |
| `Ctrl+R` | Reload file |
| `Ctrl+F` | Find in page |
| `Ctrl+=` | Zoom in |
| `Ctrl+-` | Zoom out |
| `Ctrl+0` | Reset zoom |
| `Ctrl+W` | Close window |
| `Ctrl+Shift+T` | Toggle theme |
| `Ctrl+Shift+C` | Toggle table of contents |
| `Ctrl+Shift+N` | New window |
| `Alt+F4` | Exit |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm start
```

### Build renderer bundle

```bash
npm run build:renderer
```

### Package for Windows

```bash
npm run dist
```

The installer will be output to `release/MarkdownReader-Setup-x.x.x.exe`.

## Tech Stack

- [Electron](https://www.electronjs.org/) 31 鈥?cross-platform desktop framework
- [esbuild](https://esbuild.github.io/) 鈥?JavaScript bundler
- [marked](https://marked.js.org/) 鈥?Markdown parser
- [highlight.js](https://highlightjs.org/) 鈥?syntax highlighting
- [KaTeX](https://katex.org/) 鈥?math formula rendering
- [Mermaid](https://mermaid.js.org/) 鈥?diagram rendering
- [electron-builder](https://www.electron.build/) 鈥?app packaging

## Project Structure

```
MarkdownReader/
|--  main.js              # Main process (multi-window, IPC, menu)
|--  preload.js           # Context-isolated preload bridge
|--  build-renderer.js    # esbuild bundler script
|--  src/
|    |--  index.html       # App HTML structure
|    |--  renderer.js      # Renderer process logic
|    |--  styles.css       # Application styles
|    |--  katex.css        # KaTeX stylesheet
|    |--  mermaid.min.js   # Mermaid library
|    |--  logo.png         # Application logo
|    `--  fonts/           # KaTeX font files (60 files)
|--  build/
|    `--  installer.nsh    # NSIS custom installer script
|--  MarkdownReader.ico   # Application icon (multi-size ICO)
`--  package.json         # Project metadata and build config
```

## How It Works

### Rendering Pipeline

1. **Main process** reads the Markdown file and sends content to the renderer via IPC
2. **Renderer** parses Markdown with `marked`, then applies post-processing:
   - Resolves relative image/link paths against the file directory
   - Highlights code blocks with `highlight.js`
   - Renders math formulas with `KaTeX` auto-render
   - Renders Mermaid diagrams
   - Builds the table of contents from headings
3. **File watcher** monitors the file for changes and triggers re-rendering

### Multi-Window Architecture

Each file opens in an independent `BrowserWindow` with its own state (file watcher, current path, etc.). The single-instance lock ensures that when a second file is opened (e.g., via double-click), a new window is created rather than replacing the current one. All IPC handlers use `BrowserWindow.fromWebContents()` to route actions to the correct window.

### Theme System

The app uses CSS custom properties (variables) for theming. The `data-theme` attribute on `<html>` switches between light and dark. Native title bar overlay colors are updated via `setTitleBarOverlay()` to match the active theme.

### Packaging

The build process uses `electron-builder` with NSIS target. Key optimizations:
- `marked`, `highlight.js`, and `katex` are bundled into `renderer.bundle.js` via esbuild, avoiding duplicate packaging
- Only runtime-required files (KaTeX CSS/fonts, Mermaid JS) are included in the app
- Non-essential Chromium locales are filtered out (`electronLanguages: ["zh-CN", "en-US"]`)
- Maximum compression enabled for the NSIS installer

## License

GPL-3.0
