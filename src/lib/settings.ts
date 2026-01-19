import { appConfigDir } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import type { AppSettings, ThemePreference } from '@/types';

const SETTINGS_FILENAME = 'settings.json';

const defaultSettings: AppSettings = {
  theme: 'system',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
};

function isValidTheme(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isValidFontSize(value: unknown): value is number {
  return typeof value === 'number' && value >= 8 && value <= 32;
}

function isValidFontFamily(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function sanitizeSettings(loaded: unknown): Partial<AppSettings> {
  if (typeof loaded !== 'object' || loaded === null) {
    return {};
  }

  const obj = loaded as Record<string, unknown>;
  const result: Partial<AppSettings> = {};

  if (isValidTheme(obj.theme)) result.theme = obj.theme;
  if (isValidFontSize(obj.fontSize)) result.fontSize = obj.fontSize;
  if (isValidFontFamily(obj.fontFamily)) result.fontFamily = obj.fontFamily;

  return result;
}

export async function getSettingsPath(): Promise<string> {
  const configDir = await appConfigDir();
  return `${configDir}${SETTINGS_FILENAME}`;
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const settingsPath = await getSettingsPath();

    if (await exists(settingsPath)) {
      const content = await readTextFile(settingsPath);
      const loaded = JSON.parse(content);
      const sanitized = sanitizeSettings(loaded);
      return { ...defaultSettings, ...sanitized };
    }
  } catch (error) {
    console.warn('Failed to load settings, using defaults:', error);
  }

  return { ...defaultSettings };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const configDir = await appConfigDir();
  const settingsPath = `${configDir}${SETTINGS_FILENAME}`;

  if (!(await exists(configDir))) {
    await mkdir(configDir, { recursive: true });
  }

  await writeTextFile(settingsPath, JSON.stringify(settings, null, 2));
}

export function getDefaultSettings(): AppSettings {
  return { ...defaultSettings };
}

const MIGRATION_KEY = 'mdeditor:settingsMigrated';
const LEGACY_THEME_KEY = 'mdeditor:theme';

export function migrateFromLocalStorage(): Partial<AppSettings> | null {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return null;
  }

  localStorage.setItem(MIGRATION_KEY, 'true');

  const legacyTheme = localStorage.getItem(LEGACY_THEME_KEY);
  if (isValidTheme(legacyTheme)) {
    return { theme: legacyTheme };
  }

  return null;
}
