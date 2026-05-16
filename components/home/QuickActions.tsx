import { useLanguage } from "@/context/LanguageContext";
import { useTracking } from "@/context/TrackingContext";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import { ChevronRight, ClipboardEdit, MessageCircle, Smartphone, Target, Timer } from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";

export default function QuickActions() {
  const { t } = useLanguage();
  const { currentActivity } = useTracking();
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const navigation = useNavigation<any>();
  const isDark = colorScheme === "dark";

  const displayColor = getContrastingColor(accentColor, isDark);
  const foregroundColor = (accentColor === "#18181b" && isDark) ? "#121212" : "#fff";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay: 100 }}
      style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}
    >
      <Text className="text-[10px] font-black text-zinc-500 mb-5 ml-1 tracking-[2px] uppercase">
        Get Started
      </Text>

      {/* Step 1: Goals */}
      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Light); navigation.navigate("goals"); }}
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          backgroundColor: displayColor, 
          borderRadius: 28, 
          padding: 20, 
          marginBottom: 12, 
          shadowColor: displayColor, 
          shadowOffset: { width: 0, height: 8 }, 
          shadowOpacity: 0.3, 
          shadowRadius: 16, 
          elevation: 8 
        }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Target size={22} color={foregroundColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: foregroundColor }}>
            1. Set Weekly Goals
          </Text>
          <Text style={{ fontSize: 11, color: (accentColor === "#18181b" && isDark) ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)", marginTop: 2 }}>
            Define what you want to achieve
          </Text>
        </View>
        <ChevronRight size={20} color={(accentColor === "#18181b" && isDark) ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.6)"} />
      </Pressable>

      {/* Step 2: The Ritual */}
      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Light); router.push("/onboarding/flip-tutorial"); }}
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          backgroundColor: isDark ? displayColor + "10" : displayColor + "08", 
          borderRadius: 28, 
          padding: 20, 
          marginBottom: 12, 
          borderWidth: 1, 
          borderColor: displayColor + "30" 
        }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: displayColor + "20", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <View style={{ transform: [{ rotate: "180deg" }] }}>
             <Smartphone size={22} color={displayColor} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>
            2. Flip to Focus
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? "#71717a" : "#9ca3af", marginTop: 2 }}>
            Place phone face down to start
          </Text>
        </View>
        <ChevronRight size={20} color={isDark ? "#3f3f46" : "#e5e7eb"} />
      </Pressable>

      {/* Step 3: Chat */}
      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Light); router.push("/chat"); }}
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          backgroundColor: isDark ? displayColor + "10" : displayColor + "08", 
          borderRadius: 28, 
          padding: 20, 
          borderWidth: 1, 
          borderColor: displayColor + "30" 
        }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: displayColor + "20", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <MessageCircle size={22} color={displayColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>
            3. Ask Flow
          </Text>
          <Text style={{ fontSize: 11, color: isDark ? "#71717a" : "#9ca3af", marginTop: 2 }}>
            Get productivity tips and insights
          </Text>
        </View>
        <ChevronRight size={20} color={isDark ? "#3f3f46" : "#e5e7eb"} />
      </Pressable>
    </MotiView>
  );
}
