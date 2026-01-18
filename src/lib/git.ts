import { invoke } from '@tauri-apps/api/core';

export interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

export async function gitStatus(cwd: string): Promise<GitResult> {
  return invoke<GitResult>('git_status', { cwd });
}

export async function gitAddAll(cwd: string): Promise<GitResult> {
  return invoke<GitResult>('git_add_all', { cwd });
}

export async function gitCommit(message: string, cwd: string): Promise<GitResult> {
  return invoke<GitResult>('git_commit', { message, cwd });
}

export async function gitPush(cwd: string): Promise<GitResult> {
  return invoke<GitResult>('git_push', { cwd });
}
