import { invoke as tauriInvoke, Channel } from '@tauri-apps/api/core';
import { listen as tauriListen, type UnlistenFn } from '@tauri-apps/api/event';

export { Channel };

export function isTauri(): boolean {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

export async function safeInvoke<T>(cmd: string, args?: Record<string, any>): Promise<T> {
  if (!isTauri()) {
    throw new Error(`Desktop app required: cannot execute "${cmd}" in browser mode. Please launch via Tauri.`);
  }
  return tauriInvoke<T>(cmd, args);
}

export async function safeListen<T>(event: string, handler: (event: { payload: T }) => void): Promise<UnlistenFn> {
  if (!isTauri()) {
    return () => {};
  }
  return tauriListen<T>(event, handler);
}
