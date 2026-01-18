import { memo } from 'react';
import {
  File,
  FileText,
  FileCode,
  FileJson,
  FileType,
  Folder,
  FolderOpen,
  Image,
  Settings,
  Package,
  Terminal,
  type LucideIcon,
} from 'lucide-react';

interface FileIconProps {
  name: string;
  isDirectory: boolean;
  isExpanded?: boolean;
  className?: string;
}

const extensionIconMap: Record<string, LucideIcon> = {
  // Markdown
  '.md': FileText,
  '.mdx': FileText,

  // TypeScript/JavaScript
  '.ts': FileCode,
  '.tsx': FileCode,
  '.js': FileCode,
  '.jsx': FileCode,
  '.mjs': FileCode,
  '.cjs': FileCode,

  // JSON
  '.json': FileJson,
  '.jsonc': FileJson,

  // Images
  '.png': Image,
  '.jpg': Image,
  '.jpeg': Image,
  '.gif': Image,
  '.svg': Image,
  '.webp': Image,
  '.ico': Image,

  // Config
  '.yaml': Settings,
  '.yml': Settings,
  '.toml': Settings,
  '.env': Settings,

  // CSS
  '.css': FileType,
  '.scss': FileType,
  '.sass': FileType,
  '.less': FileType,

  // Shell
  '.sh': Terminal,
  '.bash': Terminal,
  '.zsh': Terminal,
};

const filenameIconMap: Record<string, LucideIcon> = {
  'package.json': Package,
  'tsconfig.json': Settings,
  'vite.config.ts': Settings,
  'vite.config.js': Settings,
  'tailwind.config.js': Settings,
  'tailwind.config.ts': Settings,
  '.gitignore': Settings,
  '.env': Settings,
  '.env.local': Settings,
};

function getFileIcon(filename: string): LucideIcon {
  const lowerName = filename.toLowerCase();
  if (filenameIconMap[lowerName]) {
    return filenameIconMap[lowerName];
  }

  const lastDot = filename.lastIndexOf('.');
  if (lastDot !== -1) {
    const ext = filename.slice(lastDot).toLowerCase();
    if (extensionIconMap[ext]) {
      return extensionIconMap[ext];
    }
  }

  return File;
}

export const FileIcon = memo(function FileIcon({
  name,
  isDirectory,
  isExpanded = false,
  className = 'w-4 h-4',
}: FileIconProps) {
  if (isDirectory) {
    const Icon = isExpanded ? FolderOpen : Folder;
    return <Icon className={`${className} text-yellow-500`} />;
  }

  const Icon = getFileIcon(name);
  return <Icon className={`${className} text-editor-textMuted`} />;
});
