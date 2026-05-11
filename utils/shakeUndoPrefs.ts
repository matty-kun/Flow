import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "flow_shake_undo_enabled";

let cached = true;
const listeners = new Set<() => void>();

export function getShakeUndoEnabled(): boolean {
  return cached;
}

export async function loadShakeUndoPreference(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    cached = v !== "false";
  } catch {
    cached = true;
  }
  listeners.forEach((l) => l());
  return cached;
}

export async function setShakeUndoPreference(enabled: boolean): Promise<void> {
  cached = enabled;
  try {
    await AsyncStorage.setItem(KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeShakeUndoPreference(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
