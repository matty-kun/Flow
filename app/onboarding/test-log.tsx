import { CategoryIcon } from "@/components/category/CategoryIcon";
import { CATEGORIES } from "@/constants/Categories";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTracking } from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    Zap,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
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

export default function TestLogScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const { completeOnboarding } = useOnboarding();
  const { addManualActivity } = useTracking();
  const { t } = useLanguage();
  const categoryTemplates: Record<string, string> = {
    work: "Work 1h",
    health: "Walk 30m",
    study: "Study 1h",
    leisure: "Read 30m",
    other: "Meditate 20m",
  };

  const [input, setInput] = useState(categoryTemplates["work"]);
  const [selectedCategory, setSelectedCategory] = useState("work");
  type ParseResult =
    | { type: "manual"; title: string; durationMinutes: number }
    | { type: "error"; message: string };

  const [result, setResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parseLocally = (text: string): ParseResult | null => {
    const input = text.toLowerCase().trim();
    const durationRegex =
      /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/g;
    let match: RegExpExecArray | null;
    let totalMinutes = 0;
    while ((match = durationRegex.exec(input)) !== null) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      if (unit.startsWith("h")) totalMinutes += Math.round(value * 60);
      else totalMinutes += Math.round(value);
    }
    if (totalMinutes <= 0) return null;

    let title = "";
    const onMatch = text.match(/\b(?:on|for)\s+(.+)$/i);
    if (onMatch?.[1]) title = onMatch[1].trim().replace(/[.?!]+$/, "");
    if (!title) {
      title = text
        .replace(
          /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/gi,
          "",
        )
        .replace(/\b(?:on|for)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[.?!]+$/, "");
    }
    if (!title) return null;
    return { type: "manual", title, durationMinutes: totalMinutes };
  };

  const handleParseInput = async () => {
    if (!input.trim()) return;

    impact(ImpactFeedbackStyle.Light);
    setIsLoading(true);
    try {
      // Try local parser first — fast and works offline
      const local = parseLocally(input);
      if (local) {
        setResult(local);
        if (local.type === "manual") {
          await addManualActivity(
            local.title,
            selectedCategory,
            local.durationMinutes * 60,
            `Logged during onboarding: ${input}`,
          );
        }
        notification(NotificationFeedbackType.Success);
        return;
      }

      // Local parser couldn't read it
      setResult({
        type: "error",
        message: "Couldn't read that. Try: 'Read 30m' or 'Walk 1h'",
      });
    } catch (error) {
      setResult({
        type: "error",
        message: "Couldn't read that. Try: 'Read 30m' or 'Walk 1h'",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    notification(NotificationFeedbackType.Success);
    router.push("/onboarding/notifications");
  };

  const renderResult = () => {
    if (!result) return null;

    if (result.type === "error") {
      return (
        <View className="mt-6 bg-red-50 dark:bg-red-950/30 p-4 rounded-[16px] border border-red-200 dark:border-red-800 flex-row items-center">
          <AlertCircle size={16} color="#ef4444" />
          <Text className="ml-2 text-sm font-semibold text-red-700 dark:text-red-300 flex-1">
            {result.message}
          </Text>
        </View>
      );
    }

    return (
      <View className="mt-6 bg-green-50 dark:bg-green-950/30 p-4 rounded-[16px] border border-green-200 dark:border-green-800 flex-row items-center">
        <CheckCircle2 size={18} color="#10b981" />
        <View className="ml-3 flex-1">
          <Text className="text-sm font-black text-green-700 dark:text-green-300">
            Successfully logged!
          </Text>
          <Text className="text-xs text-green-600 dark:text-green-400 mt-0.5">
            {result.title} · {result.durationMinutes}m
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={2} />

      {/* Back Button */}
      <Pressable
        onPress={() => router.back()}
        className="absolute top-16 left-6 z-10 p-2"
      >
        <ChevronLeft size={24} color={isDark ? "#ffffff" : "#000000"} />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            justifyContent: "center",
            minHeight: "100%",
          }}
        >
          <View className="items-center">
            {/* Mascot */}
            <View className="items-center mb-8">
              <Image
                source={require("../../assets/images/klowk reading.png")}
                style={{ width: 180, height: 180 }}
                contentFit="contain"
              />
            </View>

            {/* Speech Bubble */}
            <View className="mb-6 flex-row items-center">
              <View className="flex-1 bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-gray-100 dark:border-zinc-800 shadow-sm">
                <TypewriterText
                  key="test-log-bubble"
                  text="Try logging something you did today, like reading or a walk. You can skip this for now."
                  className="text-base font-semibold text-klowk-black dark:text-white leading-5"
                />
                <View className="absolute -right-2 top-6 w-4 h-4 bg-white dark:bg-zinc-900 border-r border-t border-gray-100 dark:border-zinc-800 rotate-45" />
              </View>
            </View>

            {/* Input */}
            {result?.type !== "manual" && <View className="w-full mb-4">
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="e.g., 'Read 30m' or 'Walk 1h'"
                placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                className="bg-gray-50 dark:bg-zinc-900 px-4 py-3 rounded-[16px] text-base font-semibold text-klowk-black dark:text-white border border-gray-200 dark:border-zinc-800"
                editable={!isLoading}
                multiline
              />
            </View>}

            {/* Category Picker */}
            {result?.type !== "manual" && <View className="w-full mb-4">
              <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setSelectedCategory(cat.id);
                        setInput(categoryTemplates[cat.id]);
                        setResult(null);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isSelected
                          ? cat.color
                          : isDark
                            ? "#27272a"
                            : "#f3f4f6",
                        borderWidth: 1.5,
                        borderColor: isSelected ? cat.color : "transparent",
                        gap: 6,
                      }}
                    >
                      <CategoryIcon
                        name={cat.iconName}
                        size={13}
                        color={
                          isSelected ? "#fff" : isDark ? "#a1a1aa" : "#6b7280"
                        }
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: isSelected
                            ? "#fff"
                            : isDark
                              ? "#a1a1aa"
                              : "#6b7280",
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>}

            {/* Log Button */}
            {result?.type !== "manual" && <Pressable
              onPress={handleParseInput}
              disabled={!input.trim() || isLoading}
              className={`w-full py-3 px-6 rounded-[16px] items-center justify-center flex-row ${
                input.trim() && !isLoading
                  ? "bg-amber-400"
                  : "bg-gray-200 dark:bg-zinc-800"
              } mb-6`}
            >
              {isLoading ? (
                <ActivityIndicator
                  color={isDark ? "#fff" : "#fff"}
                  size="small"
                />
              ) : (
                <>
                  <Zap size={16} color="white" />
                  <Text className="ml-2 text-sm font-black text-white uppercase tracking-wider">
                    Log
                  </Text>
                </>
              )}
            </Pressable>}

            {/* Result */}
            {renderResult()}

            {/* Next Button - always available */}
            <Pressable
              onPress={handleContinue}
              className={`mt-2 py-4 px-6 rounded-[20px] w-full items-center justify-center ${result?.type === "manual" ? "bg-amber-400" : "bg-transparent border border-gray-200 dark:border-zinc-700"}`}
            >
              <Text
                className={`text-sm font-black tracking-wider ${result?.type === "manual" ? "text-white" : "text-gray-400 dark:text-zinc-500"}`}
              >
                {result?.type === "manual" ? "Next →" : "Skip for now →"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
