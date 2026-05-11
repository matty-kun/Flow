import ScreenHeader from "@/components/ui/ScreenHeader";
import { useLanguage } from "@/context/LanguageContext";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const bodyColor = isDark ? "#d4d4d8" : "#3f3f46";

  const paras = ["privacy_p1", "privacy_p2", "privacy_p3", "privacy_p4", "privacy_p5", "privacy_p6"] as const;

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t("privacy_title" as any)} onBack={() => router.back()} />
        {paras.map((key) => (
          <Text
            key={key}
            className="text-sm font-semibold leading-6 mb-5"
            style={{ color: bodyColor }}
          >
            {t(key as any)}
          </Text>
        ))}
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
