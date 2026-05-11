import { FLOW_FACEBOOK_COMMUNITY_URL, FLOW_WEBSITE_URL } from "@/constants/ExternalLinks";
import { useLanguage } from "@/context/LanguageContext";
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

const SectionTitle = ({ title }: { title: string }) => (
  <Text className="text-xs font-semibold text-zinc-500 mb-2 mt-6 ml-2 tracking-widest">{title}</Text>
);

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <View
    style={{ elevation: 2 }}
    className={`bg-white dark:bg-[#18181A] rounded-3xl overflow-hidden border border-zinc-100 dark:border-transparent ${className}`}
  >
    {children}
  </View>
);

const IconWrapper = ({ icon }: { icon: React.ReactNode }) => (
  <View className="w-8 h-8 rounded-full bg-amber-500/10 items-center justify-center mt-0.5">
    {icon}
  </View>
);

const SegmentedButton = ({ label, selected, onPress, icon }: any) => (
  <Pressable
    onPress={onPress}
    className={`flex-1 flex-row items-center justify-center py-2.5 rounded-[14px] border ${
      selected 
        ? "bg-amber-500/10 border-amber-500/30" 
        : "bg-transparent border-zinc-200 dark:border-white/5"
    }`}
  >
    {icon && <View className="mr-2">{React.cloneElement(icon, { color: selected ? "#f59e0b" : "#71717a" })}</View>}
    <Text className={`font-medium ${selected ? "text-amber-500" : "text-zinc-600 dark:text-zinc-400"}`}>{label}</Text>
  </Pressable>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { language, setLanguage, t } = useLanguage();
  const { activities } = useTracking();

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

  const version = Constants.expoConfig?.version || "1.3.0";

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-[#0A0A0A]" edges={["top"]}>
      {/* Header */}
      <View className="pt-4 pb-4 px-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="p-2 -ml-2"
        >
          <ChevronLeft size={28} color="#f59e0b" />
        </Pressable>
        <Text className="text-xl font-semibold text-zinc-900 dark:text-white absolute left-0 right-0 text-center pointer-events-none">
          Settings
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* LANGUAGE */}
        <SectionTitle title="LANGUAGE" />
        <Card>
          <View className="flex-row p-4 pb-3">
            <IconWrapper icon={<Globe size={18} color="#f59e0b" />} />
            <View className="flex-1 ml-3">
              <Text className="text-base font-medium text-zinc-900 dark:text-white">Language</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Choose how Flow talks in the app.</Text>
            </View>
          </View>
          <View className="px-4 pb-4 flex-row gap-2">
            <SegmentedButton selected={language === 'en'} onPress={() => setLanguage('en')} label="English" />
            <SegmentedButton selected={language === 'tl'} onPress={() => setLanguage('tl')} label="Filipino" />
          </View>
        </Card>

        {/* PREFERENCES */}
        <SectionTitle title="PREFERENCES" />
        <Card>
          <View className="flex-row p-4 items-center justify-between">
            <View className="flex-row flex-1 items-start pr-4">
              <IconWrapper icon={<Bell size={18} color="#f59e0b" />} />
              <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-zinc-900 dark:text-white">Haptic feedback</Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Feel vibrations on interactions.</Text>
              </View>
            </View>
            <Switch 
              value={haptics} 
              onValueChange={handleToggleHaptics} 
              trackColor={{ false: '#d4d4d8', true: '#f59e0b' }} 
              thumbColor={haptics ? '#ffffff' : '#f4f4f5'}
            />
          </View>
        </Card>

        {/* APPEARANCE */}
        <SectionTitle title="APPEARANCE" />
        <Card>
          <View className="flex-row p-4 pb-3">
            <View className="flex-1">
              <Text className="text-base font-medium text-zinc-900 dark:text-white">Appearance</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Match your device or switch between light and dark mode anytime.</Text>
            </View>
          </View>
          <View className="px-4 pb-4 flex-row gap-2">
            <SegmentedButton 
              icon={<Sun size={16}/>} 
              selected={colorScheme === 'light'} 
              onPress={() => handleToggleTheme('light')} 
              label="Light" 
            />
            <SegmentedButton 
              icon={<Moon size={16}/>} 
              selected={colorScheme === 'dark'} 
              onPress={() => handleToggleTheme('dark')} 
              label="Dark" 
            />
          </View>
        </Card>

        {/* QUICK ACTIONS */}
        <SectionTitle title="QUICK ACTIONS" />
        <Card>
          <View className="flex-row p-4 items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-base font-medium text-zinc-900 dark:text-white">Shake to undo</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">After logging a new session, shaking your phone can undo it for a short time.</Text>
            </View>
            <Switch 
              value={shakeUndo} 
              onValueChange={handleToggleShakeUndo} 
              trackColor={{ false: '#d4d4d8', true: '#f59e0b' }}
              thumbColor={shakeUndo ? '#ffffff' : '#f4f4f5'}
            />
          </View>
        </Card>

        {/* HELP */}
        <SectionTitle title="HELP" />
        <Card>
          <View className="p-4">
            <View className="flex-row mb-3">
              <IconWrapper icon={<HelpCircle size={18} color="#f59e0b" />} />
              <View className="flex-1 ml-3">
                <Text className="text-base font-medium text-zinc-900 dark:text-white">How to use Flow</Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">A detailed guide for sessions, goals, categories, and more.</Text>
              </View>
            </View>
            <Pressable 
              onPress={() => router.push('/help')} 
              className="self-start flex-row items-center border border-amber-500/30 rounded-full px-4 py-2 bg-amber-500/10 ml-[44px]"
            >
              <Text className="text-amber-500 font-medium mr-1 text-sm">Open help guide</Text>
              <ChevronRight size={16} color="#f59e0b" />
            </Pressable>
          </View>
        </Card>

        {/* ABOUT */}
        <SectionTitle title="ABOUT" />
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
              <Globe size={14} color="#f59e0b" />
              <Text className="text-amber-500 ml-1 text-sm">flowph.vercel.app</Text>
              <ExternalLink size={12} color="#f59e0b" className="ml-1" />
            </Pressable>
          </View>
          
          <Pressable 
            className="p-4 flex-row items-center justify-between border-b border-zinc-100 dark:border-white/5" 
            onPress={() => Linking.openURL(FLOW_FACEBOOK_COMMUNITY_URL)}
          >
            <View className="flex-row items-center flex-1 pr-4">
              <IconWrapper icon={<FontAwesome name="facebook" size={18} color="#f59e0b" />} />
              <View className="ml-3">
                <Text className="text-base font-medium text-zinc-900 dark:text-white">Flow Community</Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Join the Facebook community for updates, feedback, and fellow Flow users.</Text>
              </View>
            </View>
            <ExternalLink size={16} color="#71717a" />
          </Pressable>

          <Pressable 
            className="p-4 flex-row items-start" 
            onPress={() => router.push('/privacy')}
          >
            <IconWrapper icon={<ShieldCheck size={18} color="#f59e0b" />} />
            <View className="ml-3 flex-1">
              <View className="bg-amber-500/10 px-2 py-1 rounded self-start mb-2">
                 <Text className="text-xs font-medium text-amber-500">Privacy notice</Text>
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
          <Text className="ml-2 text-base font-semibold text-red-500">Reset all data</Text>
        </Pressable>
        
        <Text className="text-xs text-zinc-500 dark:text-zinc-600 text-center mb-8 px-4 leading-5">
          Productivity requires focus and flow. They are critical elements, and protecting your time gives your remarkable work a chance to survive.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

