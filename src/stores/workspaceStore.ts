import { create } from 'zustand';
import type { FileTreeNode, WorkspaceConfig, WorkspaceState } from '@/types';

interface WorkspaceActions {
  setRootPath: (path: string | null) => void;
  setCurrentFile: (path: string | null) => void;
  setSelectedSidebarItem: (path: string | null, isDirectory: boolean) => void;
  setFileTree: (tree: FileTreeNode[]) => void;
  updateFileTree: (path: string, children: FileTreeNode[]) => void;
  toggleFolder: (path: string) => void;
  setSidebarWidth: (width: number) => void;
  setPreviewEnabled: (enabled: boolean) => void;
  setConfig: (config: Partial<WorkspaceConfig>) => void;
  setLoading: (loading: boolean) => void;
  startCreatingFile: (parentPath: string) => void;
  startCreatingFolder: (parentPath: string) => void;
  startRenaming: (targetPath: string, initialValue: string) => void;
  cancelEditing: () => void;
  confirmEditing: () => void;
  navigateSidebar: (direction: 'up' | 'down') => void;
}

function flattenVisibleTree(
  nodes: FileTreeNode[],
  expandedFolders: string[]
): Array<{ path: string; isDirectory: boolean }> {
  const result: Array<{ path: string; isDirectory: boolean }> = [];

  for (const node of nodes) {
    result.push({ path: node.path, isDirectory: node.isDirectory });

    if (node.isDirectory && expandedFolders.includes(node.path) && node.children) {
      result.push(...flattenVisibleTree(node.children, expandedFolders));
    }
  }

  return result;
}

const defaultConfig: WorkspaceConfig = {
  version: '1.0.0',
  expandedFolders: [],
  sidebarWidth: 250,
  previewEnabled: false,
};

const initialState: WorkspaceState = {
  rootPath: null,
  currentFile: null,
  selectedSidebarItem: null,
  isSelectedItemDirectory: false,
  fileTree: [],
  config: defaultConfig,
  isLoading: false,
  editingState: null,
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>((set, get) => ({
  ...initialState,

  setRootPath: (path) => set({ rootPath: path }),

  setCurrentFile: (path) => set({ currentFile: path }),

  setSelectedSidebarItem: (path, isDirectory) => set({
    selectedSidebarItem: path,
    isSelectedItemDirectory: isDirectory,
  }),

  setFileTree: (tree) => set({ fileTree: tree }),

  updateFileTree: (path, children) => {
    const updateNode = (nodes: FileTreeNode[]): FileTreeNode[] =>
      nodes.map((node) => {
        if (node.path === path) {
          return { ...node, children, isLoaded: true };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });

    set({ fileTree: updateNode(get().fileTree) });
  },

  toggleFolder: (path) => {
    const expandedFolders = get().config.expandedFolders;
    const isExpanded = expandedFolders.includes(path);

    set({
      config: {
        ...get().config,
        expandedFolders: isExpanded
          ? expandedFolders.filter((p) => p !== path)
          : [...expandedFolders, path],
      },
    });
  },

  setSidebarWidth: (width) =>
    set({ config: { ...get().config, sidebarWidth: width } }),

  setPreviewEnabled: (enabled) =>
    set({ config: { ...get().config, previewEnabled: enabled } }),

  setConfig: (config) =>
    set({ config: { ...get().config, ...config } }),

  setLoading: (loading) => set({ isLoading: loading }),

  startCreatingFile: (parentPath) => {
    const expandedFolders = get().config.expandedFolders;
    const needsExpand = parentPath !== get().rootPath && !expandedFolders.includes(parentPath);

    set({
      editingState: { mode: 'creating-file', parentPath },
      ...(needsExpand && {
        config: {
          ...get().config,
          expandedFolders: [...expandedFolders, parentPath],
        },
      }),
    });
  },

  startCreatingFolder: (parentPath) => {
    const expandedFolders = get().config.expandedFolders;
    const needsExpand = parentPath !== get().rootPath && !expandedFolders.includes(parentPath);

    set({
      editingState: { mode: 'creating-folder', parentPath },
      ...(needsExpand && {
        config: {
          ...get().config,
          expandedFolders: [...expandedFolders, parentPath],
        },
      }),
    });
  },

  startRenaming: (targetPath, initialValue) => {
    const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/'));
    set({
      editingState: {
        mode: 'renaming',
        parentPath,
        targetPath,
        initialValue,
      },
    });
  },

  cancelEditing: () => set({ editingState: null }),

  confirmEditing: () => set({ editingState: null }),

  navigateSidebar: (direction) => {
    const { fileTree, config, selectedSidebarItem } = get();

    const flatItems = flattenVisibleTree(fileTree, config.expandedFolders);

    if (flatItems.length === 0) return;

    const currentIndex = flatItems.findIndex((item) => item.path === selectedSidebarItem);

    let newIndex: number;
    if (currentIndex === -1) {
      newIndex = 0;
    } else if (direction === 'up') {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(flatItems.length - 1, currentIndex + 1);
    }

    const newItem = flatItems[newIndex];
    set({
      selectedSidebarItem: newItem.path,
      isSelectedItemDirectory: newItem.isDirectory,
    });
  },
}));
