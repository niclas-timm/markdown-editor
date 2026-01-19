export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  isLoaded?: boolean;
}

export interface EditingState {
  mode: 'creating-file' | 'creating-folder' | 'renaming';
  parentPath: string;
  targetPath?: string;
  initialValue?: string;
}

export interface DragState {
  draggedPath: string;
  draggedIsDirectory: boolean;
  dropTargetPath: string | null;
  // The actual destination directory (may differ if dropping on a file)
  destinationPath: string | null;
  isValidDrop: boolean;
}

export interface WorkspaceConfig {
  version: string;
  lastOpenedFile?: string;
  expandedFolders: string[];
  sidebarWidth: number;
  previewEnabled: boolean;
  showDotfiles: boolean;
}

export interface WorkspaceState {
  rootPath: string | null;
  currentFile: string | null;
  selectedSidebarItem: string | null;
  isSelectedItemDirectory: boolean;
  fileTree: FileTreeNode[];
  config: WorkspaceConfig;
  isLoading: boolean;
  editingState: EditingState | null;
  dragState: DragState | null;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemePreference;
  fontSize: number;
  fontFamily: string;
}
