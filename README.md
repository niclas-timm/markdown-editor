# Markdown Editor

A fast, native desktop markdown editor built for developers who prefer keyboard-driven workflows.

## What is this?

A lightweight, distraction-free markdown editor that runs natively on macOS. Write markdown with syntax highlighting, see your changes rendered in real-time, and manage your files without leaving the keyboard.

## Why it's cool

**Native performance** — Built with Tauri and Rust, so it launches instantly and uses minimal system resources. No Electron bloat.

**Keyboard-first design** — Navigate files, toggle previews, run commands, and commit changes without touching your mouse. Everything is a shortcut away.

**Developer-friendly** — Built-in git integration lets you commit and push directly from the editor. Open Terminal or Finder at any path with a command.

**Real-time preview** — Side-by-side markdown preview that updates as you type. Toggle it on or off based on your preference.

**Smart workspace** — Remembers your last workspace, respects your theme preference (light/dark/system), and auto-saves your work.

## Technology

| Layer | Technology |
|-------|------------|
| Runtime | [Tauri 2](https://tauri.app) (Rust) |
| Frontend | React 19, TypeScript |
| Editor | CodeMirror 6 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Build | Vite 7 |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | `Cmd+S` |
| New file | `Cmd+N` |
| New folder | `Cmd+Shift+N` |
| Quick finder | `Cmd+P` |
| Command palette | `Cmd+Shift+P` |
| Toggle sidebar | `Cmd+B` |
| Toggle preview | `Cmd+Shift+V` |
| Focus sidebar | `Cmd+1` |
| Focus editor | `Cmd+2` |

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (install via [rustup](https://rustup.rs))
- macOS (for now)

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build

```bash
# Build for production
npm run tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Features

- Syntax-highlighted markdown editing
- Live preview with GitHub-flavored markdown
- File tree with folder navigation
- Quick file search across your workspace
- Command palette for all actions
- Light and dark themes (follows system preference)
- Git integration: status, add, commit, push
- Open Terminal or Finder at any path
- Show/hide dotfiles
- Auto-save with debouncing
- Workspace persistence

## License

MIT
