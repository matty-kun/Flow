import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { Flame, X } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
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
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadStreakMode().then((m) => {
        setSelected(m);
        setSaved(m);
      });
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start();
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

  const bg = dark ? "#1a1a1a" : "#ffffff";
  const cardBg = dark ? "#27272a" : "#f4f4f5";
  const textPrimary = dark ? "#ffffff" : "#09090b";
  const textSecondary = dark ? "#a1a1aa" : "#71717a";
  const textMuted = dark ? "#71717a" : "#a1a1aa";
  const closeBg = dark ? "#3f3f46" : "#e4e4e7";
  const cancelBg = dark ? "#27272a" : "#e4e4e7";
  const cancelText = dark ? "#ffffff" : "#09090b";
  const inactiveBg = dark ? "#27272a" : "#f4f4f5";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleCancel}>
      <View className="flex-1 justify-end">
        {/* Backdrop — stays fixed, only fades */}
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="absolute inset-0 bg-black/50"
        >
          <Pressable className="flex-1" onPress={handleCancel} />
        </Animated.View>

        {/* Sheet — slides up independently */}
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Pressable onPress={() => {}}>
            <View style={{ backgroundColor: bg }} className="rounded-t-[32px] px-6 pt-6 pb-10">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <Text style={{ color: textPrimary }} className="text-2xl font-black">Streak</Text>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={{ backgroundColor: closeBg }}
                  className="w-9 h-9 rounded-full items-center justify-center"
                >
                  <X size={18} color={textPrimary} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: textSecondary }} className="text-sm mb-6">Choose what keeps your fire going.</Text>

              {/* Streak count card */}
              <View style={{ backgroundColor: cardBg }} className="rounded-2xl px-4 py-4 flex-row items-center gap-4 mb-6">
                <View className="w-11 h-11 rounded-xl bg-amber-400/20 items-center justify-center">
                  <Flame size={22} color="#f59e0b" fill="#f59e0b" />
                </View>
                <View>
                  <Text style={{ color: textPrimary }} className="text-xl font-black">
                    {streak} {streak === 1 ? "day" : "days"}
                  </Text>
                  <Text style={{ color: textSecondary }} className="text-xs mt-0.5">{todayCountsLabel}</Text>
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
                      style={{
                        backgroundColor: active ? "rgba(251,191,36,0.1)" : inactiveBg,
                        borderColor: active ? "#f59e0b" : "transparent",
                      }}
                      className="flex-1 py-3 rounded-2xl items-center border"
                    >
                      <Text
                        style={{ color: active ? "#f59e0b" : textSecondary }}
                        className="font-bold text-sm capitalize"
                      >
                        {mode === "off" ? "Off" : "Logging"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ color: textMuted }} className="text-xs mb-8">{MODE_DESCRIPTIONS[selected]}</Text>

              {/* Actions */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleCancel}
                  style={{ backgroundColor: cancelBg }}
                  className="flex-1 py-4 rounded-2xl items-center"
                >
                  <Text style={{ color: cancelText }} className="font-bold">Cancel</Text>
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
        </Animated.View>
      </View>
    </Modal>
  );
}
