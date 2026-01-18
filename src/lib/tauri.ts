import { open } from '@tauri-apps/plugin-dialog';
import {
  readTextFile,
  writeTextFile,
  readDir,
  mkdir,
  exists,
  remove,
  rename,
} from '@tauri-apps/plugin-fs';
import type { FileTreeNode } from '@/types';

export async function selectWorkspaceDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select Workspace Directory',
  });
  return selected as string | null;
}

export async function readDirectoryContents(path: string): Promise<FileTreeNode[]> {
  const entries = await readDir(path);

  const nodes: FileTreeNode[] = entries
    .filter((entry) => {
      const name = entry.name || '';
      // Filter hidden files
      if (name.startsWith('.')) return false;
      // Show directories and .md files only
      if (!entry.isDirectory && !name.endsWith('.md')) return false;
      return true;
    })
    .map((entry) => {
      const nodePath = `${path}/${entry.name}`;
      return {
        name: entry.name || '',
        path: nodePath,
        isDirectory: entry.isDirectory ?? false,
        isLoaded: false,
      };
    });

  // Sort: directories first, then alphabetically
  return nodes.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function readFile(path: string): Promise<string> {
  return readTextFile(path);
}

export async function writeFile(path: string, content: string): Promise<void> {
  await writeTextFile(path, content);
}

export async function createDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function createFile(path: string): Promise<void> {
  await writeTextFile(path, '');
}

export async function deleteFileOrDirectory(path: string): Promise<void> {
  await remove(path, { recursive: true });
}

export async function renameFileOrDirectory(
  oldPath: string,
  newPath: string
): Promise<void> {
  await rename(oldPath, newPath);
}

export async function fileExists(path: string): Promise<boolean> {
  return exists(path);
}
