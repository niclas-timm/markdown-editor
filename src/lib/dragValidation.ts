export interface ValidationResult {
  valid: boolean;
  reason?: string;
  // The actual destination directory (may differ from targetPath if dropping on a file)
  destinationPath: string;
}

export function isValidDropTarget(
  draggedPath: string,
  draggedIsDirectory: boolean,
  targetPath: string,
  targetIsDirectory: boolean
): ValidationResult {
  // Determine the actual destination directory
  // If dropping on a file, the destination is the file's parent directory
  const destinationPath = targetIsDirectory
    ? targetPath
    : targetPath.substring(0, targetPath.lastIndexOf('/'));

  // Cannot drop item onto itself
  if (draggedPath === targetPath) {
    return { valid: false, reason: 'Cannot drop item onto itself', destinationPath };
  }

  // Cannot drop folder into its own descendant
  if (draggedIsDirectory && destinationPath.startsWith(draggedPath + '/')) {
    return { valid: false, reason: 'Cannot move folder into its own subfolder', destinationPath };
  }

  // Cannot drop into same parent directory (no-op)
  const sourceParent = draggedPath.substring(0, draggedPath.lastIndexOf('/'));
  if (sourceParent === destinationPath) {
    return { valid: false, reason: 'Item is already in this folder', destinationPath };
  }

  return { valid: true, destinationPath };
}
