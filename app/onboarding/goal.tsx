import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTracking } from "@/context/TrackingContext";
import { useAppTheme } from "@/context/ThemeContext";
import Slider from "@react-native-community/slider";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressIndicator from "./ProgressIndicator";
import TypewriterText from "./TypewriterText";

export default function GoalScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { userName, setDailyGoalHours } = useOnboarding();
  const { addCustomGoal } = useTracking();
  const { t } = useLanguage();
  const [goalHours, setGoalHours] = useState(4);
  const handleNext = () => {
    notification(NotificationFeedbackType.Success);
    router.push("/onboarding/notifications");
    setDailyGoalHours(goalHours);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 items-center justify-center">
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-6 z-10 p-2"
          >
            <ChevronLeft size={24} color={isDark ? "#ffffff" : "#000000"} />
          </Pressable>
          {/* Mascot */}
          <View className="mb-12 items-center">
            <Image
              source={require("../../assets/images/icon.png")}
              style={{ width: 160, height: 160 }}
              contentFit="contain"
            />
          </View>

          {/* Speech Bubble */}
          <View className="mb-8 flex-row items-center">
            <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <TypewriterText
                text={`Nice to meet you, ${userName}! To stay on course, how many hours of deep focus are we aiming for today?`}
                className="text-base font-semibold text-klowk-black dark:text-white leading-5"
              />
              <View className="absolute -right-2 top-6 w-4 h-4 bg-white dark:bg-zinc-900 border-r border-t border-gray-100 dark:border-zinc-800 rotate-45" />
            </View>
          </View>

          {/* Goal Display */}
          <View className="mb-8 items-center">
            <Text style={{ color: accentColor }} className="text-5xl font-black mb-2">
              {goalHours.toFixed(1)}h
            </Text>
            <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Daily Goal
            </Text>
          </View>

          {/* Slider */}
          <View className="w-full mb-10">
            <Slider
              style={{ height: 40 }}
              minimumValue={0.5}
              maximumValue={12}
              step={0.5}
              value={goalHours}
              onValueChange={(val) => {
                impact(ImpactFeedbackStyle.Light);
                setGoalHours(val);
              }}
              minimumTrackTintColor={accentColor}
              maximumTrackTintColor={isDark ? "#3f3f46" : "#e5e7eb"}
              thumbTintColor={accentColor}
            />
          </View>

          {/* Hour Labels */}
          <View className="flex-row justify-between w-full px-2 mb-10">
            <Text className="text-xs font-bold text-gray-400">30m</Text>
            <Text className="text-xs font-bold text-gray-400">6h</Text>
            <Text className="text-xs font-bold text-gray-400">12h</Text>
          </View>

          {/* Next Button */}
          <Pressable
            onPress={handleNext}
            style={{ backgroundColor: accentColor }}
            className="w-full py-12 rounded-full items-center justify-center"
          >
            <Text className="text-lg font-black text-white uppercase tracking-[2px]">
              Next → Let's Finish
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
