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
