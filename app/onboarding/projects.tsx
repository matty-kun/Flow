import { CategoryIcon } from "@/components/category/CategoryIcon";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { PRESET_COLORS, useAppTheme, getFilteredColors } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { impact, notification } from "@/utils/haptics";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressIndicator from "./ProgressIndicator";
import TypewriterText from "./TypewriterText";

const ICONS = [
  { id: "briefcase", icon: "briefcase" },
  { id: "heart", icon: "heart" },
  { id: "book-open", icon: "book-open" },
  { id: "coffee", icon: "coffee" },
  { id: "zap", icon: "zap" },
  { id: "code", icon: "code" },
  { id: "palette", icon: "palette" },
  { id: "more-horizontal", icon: "more-horizontal" },
];

export default function PrimaryGoalScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor: themeAccentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { userName, setProjects } = useOnboarding();
  const { t } = useLanguage();

  const [goalName, setGoalName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("zap");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  
  // Step control for "Thinking Flow"
  const [step, setStep] = useState(1); // 1: Name, 2: Icon, 3: Color
  
  const step2Anim = useRef(new Animated.Value(0)).current;
  const step3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (goalName.trim().length > 0 && step === 1) {
      setStep(2);
      Animated.timing(step2Anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [goalName]);

  const handleSelectIcon = (icon: string) => {
    impact(ImpactFeedbackStyle.Light);
    setSelectedIcon(icon);
    if (step === 2) {
      setStep(3);
      Animated.timing(step3Anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  };

  const handleNext = () => {
    if (!goalName.trim()) return;
    notification(NotificationFeedbackType.Success);
    // Note: We're storing the name, but icon/color are currently visual for onboarding.
    // In a full implementation, we'd create a category with these.
    setProjects([goalName.trim()]); 
    router.push("/onboarding/flip-tutorial");
  };

  const isFormValid = goalName.trim() && selectedIcon && selectedColor;

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
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-8 py-8">
            <Pressable
              onPress={() => router.back()}
              className="absolute top-4 left-6 z-10 p-2"
            >
              <ChevronLeft size={24} color={isDark ? "#ffffff" : "#000000"} />
            </Pressable>

            <View className="items-center mt-6">
              {/* Mascot - Think Flow Icon */}
              <View className="mb-6 items-center">
                <Image
                  source={require("../../assets/images/think flow.png")}
                  style={{ width: 240, height: 240 }}
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
                  placeholder="e.g. Flow, Project X, Learning..."
                  placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                  className="bg-gray-50 dark:bg-zinc-900 px-6 py-5 rounded-[24px] text-lg font-bold text-klowk-black dark:text-white border border-gray-200 dark:border-zinc-800"
                />
              </View>

              {/* Step 2: Icon Selection */}
              <Animated.View style={{ opacity: step2Anim, width: '100%', marginBottom: 32 }}>
                <Text className="text-[10px] font-black text-zinc-500 mb-4 ml-1 tracking-[2px] uppercase">
                  2. Pick an Icon
                </Text>
                <View className="flex-row flex-wrap gap-3 justify-center">
                  {ICONS.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectIcon(item.icon)}
                      style={{ 
                        backgroundColor: selectedIcon === item.icon ? selectedColor + "20" : (isDark ? "#18181b" : "#f9fafb"),
                        borderColor: selectedIcon === item.icon ? selectedColor : "transparent",
                        borderWidth: 2,
                      }}
                      className="w-14 h-14 rounded-2xl items-center justify-center"
                    >
                      <CategoryIcon 
                        name={item.icon} 
                        size={24} 
                        color={selectedIcon === item.icon ? selectedColor : (isDark ? "#52525b" : "#9ca3af")} 
                      />
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              {/* Step 3: Color Selection */}
              <Animated.View style={{ opacity: step3Anim, width: '100%', marginBottom: 12 }}>
                <Text className="text-[10px] font-black text-zinc-500 mb-4 ml-1 tracking-[2px] uppercase">
                  3. Choose a Color
                </Text>
                <View className="flex-row flex-wrap gap-5 justify-center">
                  {getFilteredColors(isDark).map((color) => (
                    <Pressable
                      key={color.id}
                      onPress={() => {
                        impact(ImpactFeedbackStyle.Light);
                        setSelectedColor(color.value);
                      }}
                      style={{ 
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        borderWidth: selectedColor === color.value ? 4 : 0,
                        borderColor: isDark ? "#fff" : "#121212",
                        elevation: selectedColor === color.value ? 6 : 0,
                        shadowColor: color.id === "white" ? "#fff" : color.value,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: selectedColor === color.value ? 0.3 : 0,
                        shadowRadius: 8,
                        overflow: 'hidden'
                      }}
                    >
                      {color.id === "white" ? (
                        <LinearGradient
                          colors={["#FFFFFF", "#E2E8F0"]}
                          style={{ flex: 1 }}
                        />
                      ) : (
                        <View style={{ flex: 1, backgroundColor: color.value }} />
                      )}
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            </View>

            <View className="flex-1 justify-end mt-8">
              <Pressable
                onPress={handleNext}
                disabled={!isFormValid}
                style={{ 
                  backgroundColor: isFormValid ? (selectedColor === "#FFFFFF" ? "transparent" : selectedColor) : (isDark ? "#18181b" : "#f4f4f5"),
                  shadowColor: selectedColor === "#FFFFFF" ? "#fff" : selectedColor,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isFormValid ? 0.4 : 0,
                  shadowRadius: 12,
                  overflow: 'hidden'
                }}
                className="w-full rounded-full items-center justify-center h-[96px]"
              >
                {isFormValid && selectedColor === "#FFFFFF" ? (
                  <LinearGradient
                    colors={["#FFFFFF", "#CBD5E1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                    className="items-center justify-center"
                  >
                    <Text className="text-lg font-black uppercase tracking-[2px] text-klowk-black">
                      CONTINUE →
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text
                    style={{ color: isFormValid ? (selectedColor === "#FFFFFF" ? "#121212" : "white") : (isDark ? "#3f3f46" : "#d1d5db") }}
                    className="text-lg font-black uppercase tracking-[2px]"
                  >
                    CONTINUE →
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
