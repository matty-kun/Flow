import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { notification } from "@/utils/haptics";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { NotificationFeedbackType } from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressIndicator from "./ProgressIndicator";
import TypewriterText from "./TypewriterText";

export default function HandshakeScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { setUserName } = useOnboarding();
  const { t } = useLanguage();
  const [name, setName] = useState("");

  const handleNext = () => {
    if (!name.trim()) return;
    notification(NotificationFeedbackType.Success);
    setUserName(name.trim());
    router.push("/onboarding/projects");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      <ProgressIndicator currentStep={1} totalSteps={4} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-8 items-center justify-center py-8">
            {/* Mascot - Clean & Minimalist */}
            <View className="mb-12 items-center">
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: 160, height: 160 }}
                contentFit="contain"
              />
            </View>

            {/* Speech Bubble */}
            <View className="mb-10 w-full">
              <View className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                <TypewriterText
                  text="I'm Flow. I help you track your deep work, one steady step at a time. What's your name?"
                  className="text-lg font-bold text-klowk-black dark:text-white leading-6 text-center"
                />
              </View>
            </View>

            {/* Input - Modern & Minimal */}
            <View className="w-full mb-8">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your name..."
                placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                className="bg-gray-50 dark:bg-zinc-900 px-6 py-4 rounded-[24px] text-lg font-bold text-klowk-black dark:text-white border border-gray-100 dark:border-zinc-800 text-center"
                autoFocus
              />
            </View>

            {/* Next Button */}
            <Pressable
              onPress={handleNext}
              disabled={!name.trim()}
              style={{ 
                backgroundColor: name.trim() ? accentColor : (isDark ? "#18181b" : "#f4f4f5"),
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: name.trim() ? 0.3 : 0,
                shadowRadius: 12,
              }}
              className="w-full py-12 rounded-full items-center justify-center"
            >
              <Text
                style={{ color: name.trim() ? "white" : (isDark ? "#3f3f46" : "#d1d5db") }}
                className="text-lg font-black uppercase tracking-[2px]"
              >
                LET'S START →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
