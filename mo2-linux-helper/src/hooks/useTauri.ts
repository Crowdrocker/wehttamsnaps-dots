import { invoke } from "@tauri-apps/api/core";

export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export function useTauri() {
  const cmd = async <T = unknown>(
    command: string,
    args?: Record<string, unknown>
  ): Promise<{ ok: boolean; message: string; data?: T }> => {
    try {
      const result = await invoke<CommandResult>(command, args);
      return { ok: result.success, message: result.message, data: result.data as T };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, message: msg };
    }
  };

  return { cmd };
}
