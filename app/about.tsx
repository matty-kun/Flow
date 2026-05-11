import ScreenHeader from "@/components/ui/ScreenHeader";
import {
  FLOW_FACEBOOK_COMMUNITY_URL,
  FLOW_WEBSITE_URL,
} from "@/constants/ExternalLinks";
import { useLanguage } from "@/context/LanguageContext";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Globe, Users } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const version =
    Constants.expoConfig?.version ??
    Constants.nativeAppVersion ??
    "—";

  const open = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      /* ignore */
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t("about_flow" as any)} onBack={() => router.back()} />

        <Text
          className="text-3xl font-black mb-1"
          style={{ color: isDark ? "#fff" : "#121212" }}
        >
          Flow
        </Text>
        <Text
          className="text-base font-bold mb-1"
          style={{ color: "#FBBF24" }}
        >
          {t("tagline_companion" as any)}
        </Text>
        <Text
          className="text-xs font-bold uppercase tracking-widest mb-6"
          style={{ color: isDark ? "#71717a" : "#9ca3af" }}
        >
          {t("version_label" as any)} {version}
        </Text>

        <Text
          className="text-sm font-semibold mb-8"
          style={{ color: isDark ? "#a1a1aa" : "#52525b" }}
        >
          {t("made_by" as any)}
        </Text>

        <Pressable
          onPress={() => open(FLOW_WEBSITE_URL)}
          className="flex-row items-center justify-center py-4 rounded-2xl mb-3 bg-klowk-black dark:bg-white"
        >
          <Globe size={18} color={isDark ? "#121212" : "#fff"} />
          <Text
            className="ml-2 text-base font-black uppercase tracking-wide"
            style={{ color: isDark ? "#121212" : "#fff" }}
          >
            {t("visit_website" as any)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => open(FLOW_FACEBOOK_COMMUNITY_URL)}
          className="flex-row items-center justify-center py-4 rounded-2xl mb-8 border-2 border-amber-400/50 bg-amber-400/10"
        >
          <Users size={18} color="#FBBF24" />
          <Text className="ml-2 text-base font-black text-amber-400 uppercase tracking-wide">
            {t("facebook_community" as any)}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/privacy")}
          className="py-4 px-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
        >
          <Text className="text-center text-sm font-black text-klowk-black dark:text-white">
            {t("open_privacy_full" as any)}
          </Text>
        </Pressable>

        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
}
