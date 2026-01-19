import { commandRegistry } from './registry';
import { gitCommitAndPushCommand } from './git/commitAndPush';
import { toggleDotfilesCommand } from './view/toggleDotfiles';
import { toggleThemeCommand } from './view/toggleTheme';
import { toggleEditorWidthCommand } from './view/toggleEditorWidth';
import { openTerminalCommand } from './system/openTerminal';
import { openFinderCommand } from './system/openFinder';
import { openSettingsCommand } from './settings/openSettings';
import { reloadSettingsCommand } from './settings/reloadSettings';

export function initializeCommands() {
  commandRegistry.register(gitCommitAndPushCommand);
  commandRegistry.register(toggleDotfilesCommand);
  commandRegistry.register(toggleThemeCommand);
  commandRegistry.register(toggleEditorWidthCommand);
  commandRegistry.register(openTerminalCommand);
  commandRegistry.register(openFinderCommand);
  commandRegistry.register(openSettingsCommand);
  commandRegistry.register(reloadSettingsCommand);
}

export * from './types';
export { commandRegistry } from './registry';
