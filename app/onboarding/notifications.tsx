import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { scheduleInactivityReminder } from "@/utils/notifications";
import { router } from "expo-router";
import { Bell, CheckCircle2, ChevronLeft, Activity } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { useAppTheme } from "@/context/ThemeContext";
import { KeyboardAvoidingView, Platform, Pressable, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressIndicator from "./ProgressIndicator";
import TypewriterText from "./TypewriterText";

export default function NotificationsScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { completeOnboarding } = useOnboarding();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);

  const handleEnableNotifications = async () => {
    impact(ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setNotificationsEnabled(true);
        notification(NotificationFeedbackType.Success);
        await scheduleInactivityReminder(21, 0);
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableMotion = async () => {
    impact(ImpactFeedbackStyle.Medium);
    // On many modern Androids, this is just a state change or a check
    // If using expo-sensors, it's usually handled by the library, 
    // but we can simulate/check for Physical Activity permission if needed.
    setMotionEnabled(true);
    notification(NotificationFeedbackType.Success);
  };

  const handleFinish = async () => {
    notification(NotificationFeedbackType.Success);
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const allPermissionsGranted = notificationsEnabled && motionEnabled;

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      <ProgressIndicator currentStep={4} totalSteps={4} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-8 items-center justify-center py-8">
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-6 z-10 p-2"
          >
            <ChevronLeft size={24} color={isDark ? "#ffffff" : "#000000"} />
          </Pressable>

          {/* Mascot */}
          <View className="mb-8 items-center">
            <Image
              source={require("../../assets/images/klowk bell.png")}
              style={{ width: 240, height: 240 }}
              contentFit="contain"
            />
          </View>

          {/* Speech Bubble */}
          <View className="mb-10 w-full">
            <View className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <TypewriterText
                text="To keep your flow protected, I need a couple of keys to the trail. Ready to finish?"
                className="text-base font-bold text-klowk-black dark:text-white leading-5 text-center"
              />
            </View>
            <Text className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[2px] mt-6 text-center">
              Tap each row to allow permissions
            </Text>
          </View>

          {/* Permissions List */}
          <View className="w-full gap-4 mb-10">
            {/* Notifications */}
            <Pressable
              onPress={handleEnableNotifications}
              disabled={notificationsEnabled}
              className={`p-5 rounded-[24px] border flex-row items-center ${
                notificationsEnabled 
                  ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30" 
                  : "bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
              }`}
            >
              <View 
                style={{ backgroundColor: notificationsEnabled ? "#10b981" : accentColor }} 
                className="w-10 h-10 rounded-full items-center justify-center"
              >
                {notificationsEnabled ? <CheckCircle2 size={20} color="white" /> : <Bell size={20} color="white" />}
              </View>
              <View className="ml-4 flex-1">
                <Text className={`font-bold ${notificationsEnabled ? "text-green-700 dark:text-green-400" : "text-klowk-black dark:text-white"}`}>
                  Notifications
                </Text>
                <Text className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                  To nudge you if you get distracted.
                </Text>
              </View>
            </Pressable>

            {/* Motion */}
            <Pressable
              onPress={handleEnableMotion}
              disabled={motionEnabled}
              className={`p-5 rounded-[24px] border flex-row items-center ${
                motionEnabled 
                  ? "bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30" 
                  : "bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800"
              }`}
            >
              <View 
                style={{ backgroundColor: motionEnabled ? "#10b981" : accentColor }} 
                className="w-10 h-10 rounded-full items-center justify-center"
              >
                {motionEnabled ? <CheckCircle2 size={20} color="white" /> : <Activity size={20} color="white" />}
              </View>
              <View className="ml-4 flex-1">
                <Text className={`font-bold ${motionEnabled ? "text-green-700 dark:text-green-400" : "text-klowk-black dark:text-white"}`}>
                  Motion & Sensors
                </Text>
                <Text className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                  To detect your focus ritual accurately.
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Finish Button */}
          <Pressable
            onPress={handleFinish}
            disabled={!allPermissionsGranted}
            style={{ 
              backgroundColor: allPermissionsGranted ? accentColor : (isDark ? "#18181b" : "#f4f4f5"),
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: allPermissionsGranted ? 0.3 : 0,
              shadowRadius: 12,
            }}
            className="w-full py-12 rounded-full items-center justify-center"
          >
            <Text
              style={{ color: allPermissionsGranted ? "white" : (isDark ? "#3f3f46" : "#d1d5db") }}
              className="text-lg font-black uppercase tracking-[2px]"
            >
              FINISH SETUP →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
