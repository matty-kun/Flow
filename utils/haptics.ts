import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const STORAGE_KEY = "@haptics_enabled";

let _enabled = true;

export async function loadHapticsPreference() {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  if (val !== null) _enabled = val === "true";
}

export async function setHapticsEnabled(enabled: boolean) {
  _enabled = enabled;
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
}

export function getHapticsEnabled() {
  return _enabled;
}

export function impact(style: Haptics.ImpactFeedbackStyle) {
  if (_enabled) {
    Haptics.impactAsync(style).catch(() => {});
  }
}

export function notification(type: Haptics.NotificationFeedbackType) {
  if (_enabled) {
    Haptics.notificationAsync(type).catch(() => {});
  }
}
