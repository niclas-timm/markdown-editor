import { commandRegistry } from './registry';
import { gitCommitAndPushCommand } from './git/commitAndPush';
import { toggleDotfilesCommand } from './view/toggleDotfiles';
import { toggleThemeCommand } from './view/toggleTheme';
import { openTerminalCommand } from './system/openTerminal';
import { openFinderCommand } from './system/openFinder';

export function initializeCommands() {
  commandRegistry.register(gitCommitAndPushCommand);
  commandRegistry.register(toggleDotfilesCommand);
  commandRegistry.register(toggleThemeCommand);
  commandRegistry.register(openTerminalCommand);
  commandRegistry.register(openFinderCommand);
}

export * from './types';
export { commandRegistry } from './registry';
