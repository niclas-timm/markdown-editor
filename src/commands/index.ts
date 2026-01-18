import { commandRegistry } from './registry';
import { gitCommitAndPushCommand } from './git/commitAndPush';
import { toggleDotfilesCommand } from './view/toggleDotfiles';
import { toggleThemeCommand } from './view/toggleTheme';

export function initializeCommands() {
  commandRegistry.register(gitCommitAndPushCommand);
  commandRegistry.register(toggleDotfilesCommand);
  commandRegistry.register(toggleThemeCommand);
}

export * from './types';
export { commandRegistry } from './registry';
