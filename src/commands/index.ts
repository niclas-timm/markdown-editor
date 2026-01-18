import { commandRegistry } from './registry';
import { gitCommitAndPushCommand } from './git/commitAndPush';

export function initializeCommands() {
  commandRegistry.register(gitCommitAndPushCommand);
}

export * from './types';
export { commandRegistry } from './registry';
