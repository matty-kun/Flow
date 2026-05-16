import CategoryCardPicker from "@/components/category/CategoryCardPicker";
import WheelPicker from "@/components/forms/WheelPicker";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useTracking } from "@/context/TrackingContext";
import { impact, notification } from "@/utils/haptics";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
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

export default function PrimaryGoalScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { userName, setProjects } = useOnboarding();
  const { categories, addCustomGoal, activities } = useTracking();
  const { t } = useLanguage();

  const [goalName, setGoalName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [targetHours, setTargetHours] = useState(10); // default 10 hours/week
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const hourValues = useMemo(() => Array.from({ length: 100 }, (_, i) => `${i}`), []);

  // Step control for onboarding progression
  const [step, setStep] = useState(1); // 1: Name, 2: Category, 3: Target Hours
  const step2Anim = useRef(new Animated.Value(0)).current;
  const step3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    if (goalName.trim().length > 0 && step === 1) {
      setStep(2);
      Animated.timing(step2Anim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [goalName]);

  const handleSelectCategory = (id: string) => {
    impact(ImpactFeedbackStyle.Light);
    setSelectedCatId(id);
    if (step === 2) {
      setStep(3);
      Animated.timing(step3Anim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  };

  const handleNext = () => {
    if (!goalName.trim() || !selectedCatId) return;
    notification(NotificationFeedbackType.Success);

    const totalMins = targetHours * 60;
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    addCustomGoal({
      id: Date.now().toString(),
      name: goalName.trim(),
      targetMins: totalMins > 0 ? totalMins : 600,
      categoryId: selectedCatId,
      startDate: startOfWeek.getTime(),
      endDate: endOfWeek.getTime(),
    });

    setProjects([goalName.trim()]);
    router.push("/onboarding/flip-tutorial");
  };

  const isFormValid = goalName.trim().length > 0 && selectedCatId && targetHours > 0;
  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const btnColor = selectedCat?.color || accentColor;

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      <ProgressIndicator currentStep={2} totalSteps={4} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingBottom: 64 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={scrollEnabled}
        >
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-0 z-10 p-2"
          >
            <ChevronLeft size={24} color={isDark ? "#ffffff" : "#000000"} />
          </Pressable>

          <View className="items-center mt-6">
            {/* Mascot */}
            <View className="mb-6 items-center">
              <Image
                source={require("../../assets/images/think flow.png")}
                style={{ width: 200, height: 200 }}
                contentFit="contain"
              />
            </View>

            <View className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm w-full mb-8">
              <TypewriterText
                text={`Nice to meet you, ${userName}! What's your primary goal right now?`}
                className="text-base font-bold text-klowk-black dark:text-white leading-5 text-center"
              />
            </View>

            {/* Step 1: Goal Name */}
            <View className="w-full mb-8">
              <Text className="text-[10px] font-black text-zinc-500 mb-3 ml-1 tracking-[2px] uppercase">
                1. Goal Name
              </Text>
              <TextInput
                value={goalName}
                onChangeText={setGoalName}
                placeholder="e.g. Learn Spanish, Read 30 pages, Gym..."
                placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                className="bg-gray-50 dark:bg-zinc-900 px-6 py-5 rounded-[24px] text-lg font-bold text-klowk-black dark:text-white border border-gray-200 dark:border-zinc-800"
              />
            </View>

            {/* Step 2: Goal Category */}
            <Animated.View style={{ opacity: step2Anim, width: "100%", marginBottom: 32 }}>
              <Text className="text-[10px] font-black text-zinc-500 mb-4 ml-1 tracking-[2px] uppercase">
                2. Select Category
              </Text>
              <CategoryCardPicker
                categories={categories}
                selectedId={selectedCatId}
                onSelect={handleSelectCategory}
                activities={activities}
              />
            </Animated.View>

            {/* Step 3: Weekly Target */}
            <Animated.View style={{ opacity: step3Anim, width: "100%", marginBottom: 32 }}>
              <Text className="text-[10px] font-black text-zinc-500 mb-4 ml-1 tracking-[2px] uppercase">
                3. Weekly Hour Target
              </Text>
              <View
                onTouchStart={() => setScrollEnabled(false)}
                onTouchEnd={() => setScrollEnabled(true)}
                onTouchCancel={() => setScrollEnabled(true)}
                className="bg-gray-50 dark:bg-zinc-900 rounded-[28px] border border-gray-100 dark:border-zinc-800 p-6 items-center"
              >
                <WheelPicker
                  values={hourValues}
                  selectedIndex={targetHours}
                  onChange={(val) => {
                    impact(ImpactFeedbackStyle.Light);
                    setTargetHours(val);
                  }}
                  itemHeight={44}
                  visibleItems={3}
                  bgColor={isDark ? "#18181b" : "#F9FAFB"}
                />
                <Text className="text-xs font-black text-zinc-400 uppercase tracking-[2px] mt-3">
                  Hours Per Week
                </Text>
              </View>
            </Animated.View>
          </View>

          <View className="flex-1 justify-end mt-4 pb-6">
            <Pressable
              onPress={handleNext}
              disabled={!isFormValid}
              style={{
                backgroundColor: isFormValid ? btnColor : isDark ? "#18181b" : "#f4f4f5",
                shadowColor: btnColor,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isFormValid ? 0.4 : 0,
                shadowRadius: 12,
              }}
              className="w-full rounded-full items-center justify-center py-6"
            >
              <Text
                style={{ color: isFormValid ? "white" : isDark ? "#3f3f46" : "#d1d5db" }}
                className="text-lg font-black uppercase tracking-[2px]"
              >
                CONTINUE →
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
