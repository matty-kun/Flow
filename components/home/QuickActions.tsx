import { useLanguage } from "@/context/LanguageContext";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import { ChevronRight, ClipboardEdit, MessageCircle, Target, Timer } from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function QuickActions() {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation<any>();
  const isDark = colorScheme === "dark";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay: 300 }}
      style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 }}
    >
      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Medium); router.push("/live"); }}
        style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FBBF24", borderRadius: 28, padding: 20, marginBottom: 12, shadowColor: "#FBBF24", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Timer size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}>{t("start_live_session")}</Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>Track your focus in real time</Text>
        </View>
        <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
      </Pressable>

      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Light); router.push("/logmanual"); }}
        style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#1c1c1e" : "#f9fafb", borderRadius: 28, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: isDark ? "#27272a" : "#f3f4f6" }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? "#27272a" : "#f3f4f6", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <ClipboardEdit size={22} color={isDark ? "#a1a1aa" : "#6b7280"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>{t("log_manually")}</Text>
          <Text style={{ fontSize: 11, color: isDark ? "#71717a" : "#9ca3af", marginTop: 2 }}>Add a session you already did</Text>
        </View>
        <ChevronRight size={20} color={isDark ? "#3f3f46" : "#e5e7eb"} />
      </Pressable>

      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Light); router.push("/chat"); }}
        style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#0f1a2e" : "#eff6ff", borderRadius: 28, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: isDark ? "#1e3a5f" : "#dbeafe" }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? "#1e3a5f" : "#dbeafe", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <MessageCircle size={22} color="#3b82f6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>Chat with Flow</Text>
          <Text style={{ fontSize: 11, color: isDark ? "#71717a" : "#9ca3af", marginTop: 2 }}>Ask anything about your focus</Text>
        </View>
        <ChevronRight size={20} color={isDark ? "#3f3f46" : "#e5e7eb"} />
      </Pressable>

      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Light); navigation.navigate("goals"); }}
        style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#0f2e2b" : "#f0fdfa", borderRadius: 28, padding: 20, borderWidth: 1, borderColor: isDark ? "#134e4a" : "#ccfbf1" }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? "#134e4a" : "#ccfbf1", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
          <Target size={22} color="#14b8a6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>{t("goals")}</Text>
          <Text style={{ fontSize: 11, color: isDark ? "#71717a" : "#9ca3af", marginTop: 2 }}>Set targets and track progress</Text>
        </View>
        <ChevronRight size={20} color={isDark ? "#3f3f46" : "#e5e7eb"} />
      </Pressable>
    </MotiView>
  );
}
