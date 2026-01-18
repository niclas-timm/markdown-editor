const LAST_WORKSPACE_KEY = 'mdeditor:lastWorkspace';

export function getLastWorkspace(): string | null {
  return localStorage.getItem(LAST_WORKSPACE_KEY);
}

export function setLastWorkspace(path: string): void {
  localStorage.setItem(LAST_WORKSPACE_KEY, path);
}

export function clearLastWorkspace(): void {
  localStorage.removeItem(LAST_WORKSPACE_KEY);
}

// Theme preference storage
const THEME_KEY = 'mdeditor:theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function getThemePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function setThemePreference(theme: ThemePreference): void {
  localStorage.setItem(THEME_KEY, theme);
}
