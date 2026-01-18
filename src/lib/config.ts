import { readFile, writeFile, fileExists } from './tauri';
import type { WorkspaceConfig } from '@/types';

const CONFIG_FILENAME = '.mdeditor.json';

const defaultConfig: WorkspaceConfig = {
  version: '1.0.0',
  expandedFolders: [],
  sidebarWidth: 250,
  previewEnabled: false,
};

export async function loadWorkspaceConfig(
  rootPath: string
): Promise<WorkspaceConfig> {
  const configPath = `${rootPath}/${CONFIG_FILENAME}`;

  if (await fileExists(configPath)) {
    try {
      const content = await readFile(configPath);
      return { ...defaultConfig, ...JSON.parse(content) };
    } catch {
      console.warn('Failed to parse workspace config, using defaults');
      return defaultConfig;
    }
  }

  return defaultConfig;
}

export async function saveWorkspaceConfig(
  rootPath: string,
  config: WorkspaceConfig
): Promise<void> {
  const configPath = `${rootPath}/${CONFIG_FILENAME}`;
  await writeFile(configPath, JSON.stringify(config, null, 2));
}
