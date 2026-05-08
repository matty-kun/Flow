import { useLanguage } from "@/context/LanguageContext";
import { ImpactFeedbackStyle } from "expo-haptics";
import { impact } from "@/utils/haptics";
import { ClipboardEdit, MessageCircle, Timer } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, Text, View } from "react-native";

type ActionWidgetProps = {
  visible: boolean;
  onClose: () => void;
  onTalkToKala: () => void;
  onLogManually: () => void;
  onStartLiveSession: () => void;
};

export default function ActionWidget({
  visible,
  onClose,
  onTalkToKala,
  onLogManually,
  onStartLiveSession,
}: ActionWidgetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 15, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start(() => { if (isMounted.current) setMounted(false); });
    }
  }, [visible]);

  const handleStartLive = () => { impact(ImpactFeedbackStyle.Light); onClose(); onStartLiveSession(); };
  const handleLogManually = () => { impact(ImpactFeedbackStyle.Light); onClose(); onLogManually(); };
  const handleTalkToKala = () => { impact(ImpactFeedbackStyle.Light); onClose(); onTalkToKala(); };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1">
        <Pressable
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />

        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            bottom: 100,
            right: 20,
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            ],
            zIndex: 10000,
          }}
        >
          <View className="bg-white dark:bg-zinc-900 rounded-[28px] p-2.5 border border-black/5 dark:border-white/5 shadow-2xl min-w-[240px]">
            <Pressable onPress={handleStartLive} style={{ borderRadius: 16, overflow: "hidden" }}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-4 px-5 rounded-2xl ${pressed ? "bg-orange-50 dark:bg-orange-950/20" : ""}`}>
                  <View className="w-9 h-9 bg-orange-100 dark:bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                    <Timer size={20} color="#FBBF24" strokeWidth={2.5} />
                  </View>
                  <Text className="text-base font-black text-klowk-black dark:text-white">
                    {t("start_live_session")}
                  </Text>
                </View>
              )}
            </Pressable>

            <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 mx-3 my-1" />

            <Pressable onPress={handleTalkToKala} style={{ borderRadius: 16, overflow: "hidden" }}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-4 px-5 rounded-2xl ${pressed ? "bg-gray-50 dark:bg-zinc-800" : ""}`}>
                  <View className="w-9 h-9 bg-gray-50 dark:bg-zinc-800 rounded-xl items-center justify-center mr-4">
                    <MessageCircle size={20} color={isDark ? "#9ca3af" : "#4b5563"} strokeWidth={2} />
                  </View>
                  <Text className="text-base font-bold text-klowk-black dark:text-white">
                    {t("talk_to_klowk")}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={handleLogManually} style={{ borderRadius: 16, overflow: "hidden" }}>
              {({ pressed }) => (
                <View className={`flex-row items-center justify-start py-4 px-5 rounded-2xl ${pressed ? "bg-gray-50 dark:bg-zinc-800" : ""}`}>
                  <View className="w-9 h-9 bg-gray-50 dark:bg-zinc-800 rounded-xl items-center justify-center mr-4">
                    <ClipboardEdit size={20} color={isDark ? "#9ca3af" : "#4b5563"} strokeWidth={2} />
                  </View>
                  <Text className="text-base font-bold text-klowk-black dark:text-white">
                    {t("log_manually")}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
