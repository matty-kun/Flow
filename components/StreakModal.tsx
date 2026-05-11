import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { Flame, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StreakMode = "off" | "logging";

const STREAK_MODE_KEY = "klowk_streak_mode";

export async function loadStreakMode(): Promise<StreakMode> {
  const val = await AsyncStorage.getItem(STREAK_MODE_KEY);
  if (val === "off" || val === "logging") return val;
  return "logging";
}

export async function saveStreakMode(mode: StreakMode): Promise<void> {
  await AsyncStorage.setItem(STREAK_MODE_KEY, mode);
}

interface Props {
  visible: boolean;
  streak: number;
  onClose: () => void;
  onSaved?: () => void;
}

const MODE_DESCRIPTIONS: Record<StreakMode, string> = {
  logging: "Count days where you log at least one focus session.",
  off: "Streaks are turned off.",
};

export default function StreakModal({ visible, streak, onClose, onSaved }: Props) {
  const [selected, setSelected] = useState<StreakMode>("logging");
  const [saved, setSaved] = useState<StreakMode>("logging");

  useEffect(() => {
    if (visible) {
      loadStreakMode().then((m) => {
        setSelected(m);
        setSaved(m);
      });
    }
  }, [visible]);

  const handleSave = async () => {
    await saveStreakMode(selected);
    setSaved(selected);
    impact(ImpactFeedbackStyle.Medium);
    onClose();
    onSaved?.();
  };

  const handleCancel = () => {
    setSelected(saved);
    onClose();
  };

  const todayCountsLabel =
    streak > 0 ? "Today already counts toward your streak." : "Log a session today to start your streak.";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={handleCancel}>
        <Pressable onPress={() => {}}>
          <View className="bg-[#1a1a1a] rounded-t-[32px] px-6 pt-6 pb-10">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-2xl font-black">Streak</Text>
              <TouchableOpacity
                onPress={handleCancel}
                className="w-9 h-9 rounded-full bg-zinc-800 items-center justify-center"
              >
                <X size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text className="text-zinc-400 text-sm mb-6">Choose what keeps your fire going.</Text>

            {/* Streak count card */}
            <View className="bg-zinc-800 rounded-2xl px-4 py-4 flex-row items-center gap-4 mb-6">
              <View className="w-11 h-11 rounded-xl bg-amber-400/20 items-center justify-center">
                <Flame size={22} color="#f59e0b" fill="#f59e0b" />
              </View>
              <View>
                <Text className="text-white text-xl font-black">
                  {streak} {streak === 1 ? "day" : "days"}
                </Text>
                <Text className="text-zinc-400 text-xs mt-0.5">{todayCountsLabel}</Text>
              </View>
            </View>

            {/* Mode selector */}
            <View className="flex-row gap-3 mb-4">
              {(["off", "logging"] as StreakMode[]).map((mode) => {
                const active = selected === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => { impact(ImpactFeedbackStyle.Light); setSelected(mode); }}
                    className={`flex-1 py-3 rounded-2xl items-center border ${
                      active
                        ? "bg-amber-400/10 border-amber-400"
                        : "bg-zinc-800 border-transparent"
                    }`}
                  >
                    <Text
                      className={`font-bold text-sm capitalize ${
                        active ? "text-amber-400" : "text-zinc-400"
                      }`}
                    >
                      {mode === "off" ? "Off" : "Logging"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-zinc-500 text-xs mb-8">{MODE_DESCRIPTIONS[selected]}</Text>

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 py-4 rounded-2xl bg-zinc-800 items-center"
              >
                <Text className="text-white font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 py-4 rounded-2xl bg-amber-400 items-center"
              >
                <Text className="text-white font-black">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
