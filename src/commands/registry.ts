import type { Command } from './types';

class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  getFiltered(query: string): Command[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll()
      .filter((cmd) => {
        const searchText = `${cmd.category || ''} ${cmd.label}`.toLowerCase();
        return searchText.includes(lowerQuery);
      })
      .filter((cmd) => cmd.isEnabled?.() ?? true);
  }
}

export const commandRegistry = new CommandRegistry();
