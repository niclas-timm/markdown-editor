import { useCallback, useRef } from 'react';
import {
  readFile,
  writeFile,
  readDirectoryContents,
  createDirectory,
  createFile,
  renameFileOrDirectory,
  deleteFileOrDirectory,
  fileExists,
} from '@/lib/tauri';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function useFileSystem() {
  const { rootPath, setFileTree, updateFileTree } = useWorkspaceStore();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRootDirectory = useCallback(async () => {
    if (!rootPath) return;
    const tree = await readDirectoryContents(rootPath);
    setFileTree(tree);
  }, [rootPath, setFileTree]);

  const loadDirectoryContents = useCallback(
    async (path: string) => {
      const children = await readDirectoryContents(path);
      updateFileTree(path, children);
    },
    [updateFileTree]
  );

  const loadFileContent = useCallback(async (path: string) => {
    return readFile(path);
  }, []);

  // Debounced save with 500ms delay
  const saveFileContent = useCallback((path: string, content: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await writeFile(path, content);
    }, 500);
  }, []);

  // Immediate save for Cmd+S
  const saveFileContentImmediate = useCallback(
    async (path: string, content: string) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      await writeFile(path, content);
    },
    []
  );

  const createNewFile = useCallback(
    async (directoryPath: string, fileName: string) => {
      const filePath = `${directoryPath}/${fileName}`;
      await createFile(filePath);
      // Reload parent directory
      if (directoryPath === rootPath) {
        await loadRootDirectory();
      } else {
        await loadDirectoryContents(directoryPath);
      }
      return filePath;
    },
    [rootPath, loadRootDirectory, loadDirectoryContents]
  );

  const createNewDirectory = useCallback(
    async (parentPath: string, dirName: string) => {
      const dirPath = `${parentPath}/${dirName}`;
      await createDirectory(dirPath);
      // Reload parent directory
      if (parentPath === rootPath) {
        await loadRootDirectory();
      } else {
        await loadDirectoryContents(parentPath);
      }
      return dirPath;
    },
    [rootPath, loadRootDirectory, loadDirectoryContents]
  );

  const renameItem = useCallback(
    async (oldPath: string, newName: string) => {
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${parentPath}/${newName}`;

      // Check if target already exists
      if (await fileExists(newPath)) {
        throw new Error('A file or folder with that name already exists');
      }

      await renameFileOrDirectory(oldPath, newPath);

      // Reload parent directory
      if (parentPath === rootPath) {
        await loadRootDirectory();
      } else {
        await loadDirectoryContents(parentPath);
      }

      return newPath;
    },
    [rootPath, loadRootDirectory, loadDirectoryContents]
  );

  const deleteItem = useCallback(
    async (path: string) => {
      const parentPath = path.substring(0, path.lastIndexOf('/'));

      await deleteFileOrDirectory(path);

      // Reload parent directory
      if (parentPath === rootPath) {
        await loadRootDirectory();
      } else {
        await loadDirectoryContents(parentPath);
      }
    },
    [rootPath, loadRootDirectory, loadDirectoryContents]
  );

  const checkFileExists = useCallback(async (path: string) => {
    return fileExists(path);
  }, []);

  return {
    loadRootDirectory,
    loadDirectoryContents,
    loadFileContent,
    saveFileContent,
    saveFileContentImmediate,
    createNewFile,
    createNewDirectory,
    renameItem,
    deleteItem,
    checkFileExists,
  };
}
