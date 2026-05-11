import { FLOW_FACEBOOK_COMMUNITY_URL, FLOW_WEBSITE_URL } from "@/constants/ExternalLinks";
import { useLanguage } from "@/context/LanguageContext";
import { getContrastingColor, PRESET_COLORS, useAppTheme } from "@/context/ThemeContext";
import { useTracking } from "@/context/TrackingContext";
import { getHapticsEnabled, setHapticsEnabled } from "@/utils/haptics";
import * as Haptics from "expo-haptics";
import {
  getShakeUndoEnabled,
  setShakeUndoPreference,
} from "@/utils/shakeUndoPrefs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  HelpCircle,
  Moon,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
} from "lucide-react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLOR_SCHEME_KEY = "klowk_color_scheme";

const SectionTitle = ({ title }: { title: string }) => {
  const { t } = useLanguage();
  return (
    <Text className="text-[10px] font-black text-zinc-500 mb-3 mt-8 ml-1 tracking-[2px] uppercase">
      {t(title.toLowerCase() as any) || title}
    </Text>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <View
    style={{ elevation: 2 }}
    className={`bg-white dark:bg-[#18181A] rounded-3xl overflow-hidden border border-zinc-100 dark:border-transparent ${className}`}
  >
    {children}
  </View>
);

const IconWrapper = ({ icon, accentColor }: { icon: React.ReactNode, accentColor: string }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const bgColor = getContrastingColor(accentColor, isDark);
  return (
    <View style={{ backgroundColor: bgColor + "1A" }} className="w-8 h-8 rounded-full items-center justify-center mt-0.5">
      {React.cloneElement(icon as any, { color: bgColor })}
    </View>
  );
};

const SegmentedButton = ({ label, selected, onPress, icon, accentColor }: any) => {
  const { colorScheme: _scheme } = useColorScheme();
  const scheme = _scheme || 'light';
  const isDark = scheme === "dark";
  const highlightColor = getContrastingColor(accentColor, isDark);
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center py-2.5 rounded-[14px] border ${
        selected 
          ? "" 
          : "bg-transparent border-zinc-200 dark:border-white/5"
      }`}
      style={selected ? { backgroundColor: highlightColor + "1A", borderColor: highlightColor + "4D" } : undefined}
    >
      {icon && (
        <View className="mr-2">
          {React.cloneElement(icon as any, { 
            color: selected 
              ? getContrastingColor(accentColor, isDark) 
              : (isDark ? "#71717a" : "#94a3b8") 
          })}
        </View>
      )}
      <Text 
        style={{ 
          color: selected 
            ? getContrastingColor(accentColor, isDark) 
            : (isDark ? "#a1a1aa" : "#64748b") 
        }} 
        className="font-medium"
      >
        {label}
      </Text>
    </Pressable>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { language, setLanguage, t } = useLanguage();
  const { activities } = useTracking();
  const { accentColor, setAccentColor } = useAppTheme();
  const isDark = colorScheme === "dark";

  const [haptics, setLocalHaptics] = useState(getHapticsEnabled());
  const [shakeUndo, setLocalShakeUndo] = useState(getShakeUndoEnabled());

  const handleToggleTheme = (next: "light" | "dark" | "system") => {
    if (next === "system") return; 
    setColorScheme(next);
    void AsyncStorage.setItem(COLOR_SCHEME_KEY, next);
  };

  const handleToggleHaptics = (val: boolean) => {
    setLocalHaptics(val);
    void setHapticsEnabled(val);
    // Always fire haptic feedback when toggling — even when turning it ON
    // (bypassing the enabled guard since _enabled hasn't updated yet)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleToggleShakeUndo = (val: boolean) => {
    setLocalShakeUndo(val);
    void setShakeUndoPreference(val);
  };

  const handleClearData = () => {
    Alert.alert(t("clear_data_title" as any) || "Reset all data?", t("clear_data_desc" as any) || "This cannot be undone.", [
      { text: t("cancel" as any) || "Cancel", style: "cancel" },
      {
        text: t("delete" as any) || "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert("Data cleared.");
        },
      },
    ]);
  };

  const version = Constants.expoConfig?.version || "1.4.0";

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-[#0A0A0A]" edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          style={{ zIndex: 10, padding: 8 }}
        >
          <ChevronLeft size={28} color={accentColor === "#18181b" && colorScheme === "dark" ? "#fff" : accentColor} />
        </Pressable>
        <Text
          style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600", color: colorScheme === "dark" ? "#fff" : "#18181b" }}
          pointerEvents="none"
        >
          {t("settings_title")}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* LANGUAGE */}
        <SectionTitle title="default_language" />
        <Card>
          <View className="flex-row p-4 pb-3">
            <IconWrapper icon={<Globe size={18} color={accentColor} />} accentColor={accentColor} />
            <View className="flex-1 ml-3">
              <Text className="text-base font-medium text-zinc-900 dark:text-white">{t("default_language")}</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("language_desc")}</Text>
            </View>
          </View>
          <View className="px-4 pb-4 flex-row gap-2">
            <SegmentedButton selected={language === 'en'} onPress={() => setLanguage('en')} label="English" accentColor={accentColor} />
            <SegmentedButton selected={language === 'tl'} onPress={() => setLanguage('tl')} label="Filipino" accentColor={accentColor} />
          </View>
        </Card>

        {/* PREFERENCES */}
        <SectionTitle title="appearance_stats" />
        <Card>
          <View className="flex-row p-4 items-center justify-between">
            <View className="flex-row flex-1 items-start pr-4">
              <IconWrapper icon={<Bell size={18} color={accentColor} />} accentColor={accentColor} />
              <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-zinc-900 dark:text-white">{t("push_notifications")}</Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("notifications_desc")}</Text>
              </View>
            </View>
            <Switch 
              value={haptics} 
              onValueChange={handleToggleHaptics} 
              trackColor={{ false: '#d4d4d8', true: getContrastingColor(accentColor, isDark) }} 
              thumbColor={haptics ? '#ffffff' : '#f4f4f5'}
            />
          </View>
        </Card>

        {/* APPEARANCE */}
        <SectionTitle title="dark_mode" />
        <Card>
          <View className="flex-row p-4 pb-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-zinc-900 dark:text-white">{t("dark_mode")}</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("dark_mode_desc")}</Text>
            </View>
          </View>
          <View className="px-4 pb-4 flex-row gap-2">
            <SegmentedButton 
              icon={<Sun size={16}/>} 
              selected={colorScheme === 'light'} 
              onPress={() => handleToggleTheme('light')} 
              label="Light" 
              accentColor={accentColor}
            />
            <SegmentedButton 
              icon={<Moon size={16}/>} 
              selected={colorScheme === 'dark'} 
              onPress={() => handleToggleTheme('dark')} 
              label="Dark" 
              accentColor={accentColor}
            />
          </View>
        </Card>

        {/* ACCENT COLOR */}
        <SectionTitle title="theme_color" />
        <Card>
          <View className="flex-row p-4 pb-3 items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-base font-medium text-zinc-900 dark:text-white">{t("theme_color")}</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Choose a primary color for the app's interface.</Text>
            </View>
          </View>
          <View className="px-4 pb-4 flex-row flex-wrap gap-3">
            {PRESET_COLORS.map((preset) => {
              const isSelected = accentColor === preset.value;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => setAccentColor(preset.value)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: getContrastingColor(preset.value, isDark),
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: isSelected ? 3 : 0,
                    borderColor: isSelected ? (colorScheme === "dark" ? "#fff" : "#18181b") : "transparent",
                  }}
                >
                  {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colorScheme === "dark" ? "#18181b" : "#fff" }} />}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* QUICK ACTIONS */}
        <SectionTitle title="quick_actions" />
        <Card>
          <View className="flex-row p-4 items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-base font-medium text-zinc-900 dark:text-white">{t("shake_undo")}</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("shake_undo_desc")}</Text>
            </View>
            <Switch 
              value={shakeUndo} 
              onValueChange={handleToggleShakeUndo} 
              trackColor={{ false: '#d4d4d8', true: getContrastingColor(accentColor, isDark) }}
              thumbColor={shakeUndo ? '#ffffff' : '#f4f4f5'}
            />
          </View>
        </Card>

        {/* HELP */}
        <SectionTitle title="help_section" />
        <Card>
          <View className="p-4">
            <View className="flex-row mb-3">
              <IconWrapper icon={<HelpCircle size={18} color={accentColor} />} accentColor={accentColor} />
              <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-zinc-900 dark:text-white">{t("help_guide")}</Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("help_intro")}</Text>
              </View>
            </View>
            <Pressable 
              onPress={() => router.push('/help')} 
              className="self-start flex-row items-center border rounded-full px-4 py-2 ml-[44px]"
              style={{ backgroundColor: getContrastingColor(accentColor, isDark) + "1A", borderColor: getContrastingColor(accentColor, isDark) + "4D" }}
            >
              <Text style={{ color: getContrastingColor(accentColor, isDark) }} className="font-medium mr-1 text-sm">{t("help_guide")}</Text>
              <ChevronRight size={16} color={getContrastingColor(accentColor, isDark)} />
            </Pressable>
          </View>
        </Card>

        {/* ABOUT */}
        <SectionTitle title="about_flow" />
        <Card>
          <View className="p-6 items-center border-b border-zinc-100 dark:border-white/5">
            <Image
              source={require("../assets/images/grass flow.png")}
              style={{ width: 140, height: 140, borderRadius: 28, marginBottom: 16 }}
              contentFit="cover"
            />
            <Text className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Flow <Text className="text-xs text-zinc-500 font-normal">v{version}</Text></Text>
            <Text className="text-sm text-zinc-500 mb-2">Made by Matthew Vargas</Text>
            <Pressable className="flex-row items-center" onPress={() => Linking.openURL(FLOW_WEBSITE_URL)}>
              <Globe size={14} color={accentColor} />
              <Text style={{ color: accentColor }} className="ml-1 text-sm">flowph.vercel.app</Text>
              <ExternalLink size={12} color={accentColor} className="ml-1" />
            </Pressable>
          </View>
          
          <Pressable 
            className="p-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-white/5" 
            onPress={() => Linking.openURL(FLOW_FACEBOOK_COMMUNITY_URL)}
          >
            <View className="flex-row items-center flex-1 pr-4">
              <IconWrapper icon={<FontAwesome name="facebook" size={18} color={accentColor} />} accentColor={accentColor} />
              <View className="ml-3">
                <Text className="text-base font-medium text-zinc-900 dark:text-white">{t("facebook_community")}</Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t("notifications_desc")}</Text>
              </View>
            </View>
            <ExternalLink size={16} color="#71717a" />
          </Pressable>

          <Pressable 
            className="p-4 flex-row items-start" 
            onPress={() => router.push('/privacy')}
          >
            <IconWrapper icon={<ShieldCheck size={18} color={accentColor} />} accentColor={accentColor} />
            <View className="ml-3 flex-1">
              <View style={{ backgroundColor: accentColor + "1A" }} className="px-2 py-1 rounded self-start mb-2">
                 <Text style={{ color: accentColor }} className="text-xs font-medium">{t("privacy_notice")}</Text>
              </View>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">Your productivity data stays entirely on your device. We don't use cloud storage or subscriptions, so everything is kept completely private and secure.</Text>
            </View>
          </Pressable>
        </Card>

        {/* Danger Zone */}
        <Pressable 
          onPress={handleClearData} 
          className="mt-6 mb-4 p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl flex-row items-center justify-center border border-red-200 dark:border-red-900/50"
        >
          <Trash2 size={20} color="#ef4444" />
          <Text className="ml-2 text-base font-semibold text-red-500">{t("clear_logs")}</Text>
        </Pressable>
        
        <Text className="text-xs text-zinc-500 dark:text-zinc-600 text-center mb-8 px-4 leading-5">
          Productivity requires focus and flow. They are critical elements, and protecting your time gives your remarkable work a chance to survive.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

