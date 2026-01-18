import { invoke } from '@tauri-apps/api/core';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export interface ShellResult {
  success: boolean;
  error?: string;
}

export async function openTerminalAt(path: string): Promise<ShellResult> {
  return invoke<ShellResult>('open_terminal_at', { path });
}

export async function openFinderAt(path: string): Promise<ShellResult> {
  return invoke<ShellResult>('open_finder_at', { path });
}

export function resolveCurrentDirectory(): string | null {
  const { rootPath, currentFile, selectedSidebarItem, isSelectedItemDirectory } =
    useWorkspaceStore.getState();

  if (selectedSidebarItem) {
    if (isSelectedItemDirectory) {
      return selectedSidebarItem;
    }
    const lastSlash = selectedSidebarItem.lastIndexOf('/');
    return lastSlash > 0 ? selectedSidebarItem.substring(0, lastSlash) : selectedSidebarItem;
  }

  if (currentFile) {
    const lastSlash = currentFile.lastIndexOf('/');
    return lastSlash > 0 ? currentFile.substring(0, lastSlash) : currentFile;
  }

  return rootPath;
}
