import type { Command } from '../types';
import { gitAddAll, gitCommit, gitPush, gitStatus } from '@/lib/git';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export const gitCommitAndPushCommand: Command = {
  id: 'git.commitAllAndPush',
  label: 'Commit All and Push',
  category: 'Git',

  isEnabled: () => {
    const { rootPath } = useWorkspaceStore.getState();
    return rootPath !== null;
  },

  execute: async (context) => {
    const { rootPath } = context;

    if (!rootPath) {
      context.showNotification('No workspace open', 'error');
      return;
    }

    const status = await gitStatus(rootPath);
    if (!status.success) {
      context.showNotification(`Git error: ${status.error}`, 'error');
      return;
    }

    if (!status.output.trim()) {
      context.showNotification('No changes to commit', 'info');
      return;
    }

    const message = await context.requestInput({
      title: 'Commit Message',
      placeholder: 'Enter commit message...',
    });

    if (!message) {
      return;
    }

    const addResult = await gitAddAll(rootPath);
    if (!addResult.success) {
      context.showNotification(`Failed to stage changes: ${addResult.error}`, 'error');
      return;
    }

    const commitResult = await gitCommit(message, rootPath);
    if (!commitResult.success) {
      context.showNotification(`Commit failed: ${commitResult.error}`, 'error');
      return;
    }

    const pushResult = await gitPush(rootPath);
    if (!pushResult.success) {
      context.showNotification(`Push failed: ${pushResult.error}`, 'error');
      return;
    }

    context.showNotification('Changes committed and pushed successfully', 'success');
  },
};
