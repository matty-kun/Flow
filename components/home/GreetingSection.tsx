import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useTracking } from "@/context/TrackingContext";
import { formatDuration } from "@/utils/time";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image, Text, View, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Settings2 } from "lucide-react-native";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import { useFocusMode } from "@/context/FocusModeContext";
import { Zap } from "lucide-react-native";

const FORECAST_MESSAGES: Record<string, Record<string, string>> = {
  on_track: {
    en: "Slow and steady wins the race! We're right on trail, keep leaving that silver streak!",
    tl: "Dahan-dahan pero sigurado! On track tayo, keep leaving that silver streak!",
  },
  behind: {
    en: "The path is getting long. Even a snail gets there with consistent steps. Try one more focused hour.",
    tl: "Medyo nahuhuli na tayo. Kahit mabagal, consistent lang, try one more focused hour.",
  },
  burnout: {
    en: "Even snails tuck in sometimes. You've been crawling hard, pull back and rest a bit.",
    tl: "Kahit ang pinaka-sipag ay nagpapahinga. Nagtatrabaho ka nang husto, magpahinga muna.",
  },
  at_risk: {
    en: "Good pace, but the finish line is still far. One small push keeps us on the trail.",
    tl: "Magandang pace, pero malayo pa ang finish line. Isang maliit na push lang para manatili tayo sa daan.",
  },
};

const FLOW_SAYINGS = {
  win: {
    en: [
      "You've focused for {time} today. Stellar work!",
      "That's {time} of pure focus today. Keep the momentum going!",
      "{time} locked in today. You're building something great.",
      "Crushed {time} of deep work today. Flow state achieved.",
    ],
    tl: [
      "Na-focus ka na ng {time} ngayon. Stellar work!",
      "{time} ng pure focus ngayon. Keep the momentum!",
      "{time} na locked in ngayon. Binubuo mo ng something great.",
      "Crushed {time} of deep work ngayon. Flow state achieved.",
    ],
  },
  ready: {
    en: [
      "Ready for a deep focus session? I'm here to help you track your wins.",
      "Your next breakthrough is one session away. Let's get started.",
      "Every great work day starts with the first focus block. Ready?",
    ],
    tl: [
      "Ready na for a deep focus session? Nandito ako to help you track your wins.",
      "One session away na ang iyong next breakthrough. Tara na.",
      "Every great work day starts with the first focus block. Ready?",
    ],
  },
};

interface Props {
  klowkForecastStatus: string;
  klowkForecastMessage: string;
  todayMinsTotal: number;
  dayOfWeek: string;
  dayOfMonth: string;
  greetingKey: string;
}

export default function GreetingSection({
  klowkForecastStatus,
  klowkForecastMessage,
  todayMinsTotal,
  dayOfWeek,
  dayOfMonth,
  greetingKey,
} : Props) {
  const { t, language } = useLanguage();
  const { userName } = useOnboarding();
  const { accentColor } = useAppTheme();
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation<any>();
  const { isSensorEnabled, setIsSensorEnabled } = useFocusMode();
  const isDark = colorScheme === "dark";

  const isWhiteTheme = accentColor.toLowerCase().trim() === "#ffffff" || accentColor.toLowerCase().trim() === "#fff";
  const isBlackTheme = accentColor.toLowerCase().trim() === "#18181b";

  const bubbleText =
    klowkForecastStatus === "no_goal"
      ? (() => {
          const lang = language === "tl" ? "tl" : "en";
          const dayIdx = new Date().getDate();
          if (todayMinsTotal > 0) {
            const pool = FLOW_SAYINGS.win[lang];
            return pool[dayIdx % pool.length].replace(
              "{time}",
              formatDuration(Math.floor(todayMinsTotal / 60)),
            );
          }
          const pool = FLOW_SAYINGS.ready[lang];
          return pool[dayIdx % pool.length];
        })()
      : (FORECAST_MESSAGES[klowkForecastStatus]?.[
          language === "tl" ? "tl" : "en"
        ] ?? klowkForecastMessage);

  const gradientColors = isDark 
    ? [accentColor + (isWhiteTheme ? "CC" : "70"), accentColor + (isWhiteTheme ? "99" : "20"), isWhiteTheme ? "#FFFFFF" : "#0A0A0A"] 
    : [accentColor + "80", accentColor + "30", isWhiteTheme ? "#FFFFFF" : "#f1f3f1"];

  const bubbleBg = isDark ? (isWhiteTheme ? "rgba(255,255,255,0.98)" : "rgba(45,45,50,0.95)") : "rgba(255,255,255,0.98)";

  return (
    <LinearGradient
      colors={gradientColors as any}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ paddingTop: 40, paddingBottom: 100, overflow: "hidden" }}
    >
      {/* Header Buttons */}
      <View className="flex-row justify-between items-center px-6 mt-2 mb-2">
        <TouchableOpacity
          onPress={() => { 
            impact(ImpactFeedbackStyle.Medium);
            setIsSensorEnabled(!isSensorEnabled); 
          }}
          className={`px-4 py-2.5 rounded-full flex-row items-center backdrop-blur-md border`}
          style={{ 
            backgroundColor: isSensorEnabled ? accentColor : (isWhiteTheme && isDark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"),
            borderColor: isSensorEnabled ? accentColor : (isWhiteTheme && isDark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)")
          }}
        >
          <Zap size={14} color={isSensorEnabled ? "white" : (isWhiteTheme && isDark ? "#000" : (isDark ? "#fff" : "#2d3748"))} />
          <Text 
            className={`ml-1.5 text-[10px] font-black uppercase tracking-[2px] ${
              isSensorEnabled ? "text-white" : (isWhiteTheme && isDark ? "text-klowk-black" : "text-white dark:text-white/80")
            }`}
          >
            {isSensorEnabled ? "FOCUS ON" : "FOCUS OFF"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { impact(ImpactFeedbackStyle.Medium); navigation.navigate("settings"); }}
          className="p-2.5 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-md border border-white/10"
        >
          <Settings2 size={20} color={isWhiteTheme && isDark ? "#000" : (isDark ? "#fff" : "#2d3748")} />
        </TouchableOpacity>
      </View>

      <View className="px-6 mb-8">
        <Text className={`${isWhiteTheme && isDark ? "text-gray-400" : "text-gray-500 dark:text-gray-400"} font-bold uppercase text-[11px] tracking-[1.5px] mb-1`}>
          {dayOfWeek}, {dayOfMonth}
        </Text>
        <Text className={`text-[28px] font-black ${isWhiteTheme && isDark ? "text-klowk-black" : "text-klowk-black dark:text-white"}`}>
          {t(greetingKey as any)} <Text style={{ color: isBlackTheme && isDark ? "#fff" : (isWhiteTheme && isDark ? "#000" : accentColor) }}>{userName || "User"}!</Text>
        </Text>
      </View>

      <View className="px-6 flex-row items-center -mt-6">
        <View 
          className="w-[120px] h-[120px] overflow-visible relative items-center justify-center"
          style={{ marginTop: -25 }}
        >
          {/* Snail Shadow */}
          <View 
            style={{ 
              position: "absolute", 
              width: 120, 
              height: 16, 
              backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.15)", 
              borderRadius: 50, 
              bottom: -20,
              left: -20,
              transform: [{ scaleX: 1.5 }],
              filter: "blur(4px)"
            }} 
          />
          <Image
            source={todayMinsTotal > 240 
              ? require("../../assets/images/sleepy flow.png")
              : require("../../assets/images/icon.png")
            }
            style={{ width: 160, height: 160, marginLeft: -30, zIndex: 1 }}
            resizeMode="contain"
          />
        </View>
        <View 
          style={{ 
            flex: 1, 
            backgroundColor: bubbleBg,
            marginLeft: 0,
            padding: 16,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            shadowColor: isDark ? (isWhiteTheme ? "#000" : "#888") : "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDark ? (isWhiteTheme ? 0.1 : 0.25) : 0.15,
            shadowRadius: 16,
            elevation: 15,
            position: "relative",
            zIndex: 2,
            marginBottom: 10
          }}
        >
          {/* Rotated Square Tail */}
          <View 
            style={{ 
              position: "absolute", 
              left: -8, 
              top: "40%", 
              width: 16,
              height: 16,
              backgroundColor: isDark ? (isWhiteTheme ? "#fff" : "rgba(45,45,50,1)") : "white",
              transform: [{ rotate: "45deg" }],
              borderLeftWidth: 1,
              borderBottomWidth: 1,
              borderColor: isDark ? (isWhiteTheme ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.1)") : "rgba(0,0,0,0.05)",
              zIndex: -1
            }} 
          />
          <Text className={`text-[13px] ${isWhiteTheme && isDark ? "text-klowk-black" : "text-klowk-black dark:text-white"} font-bold leading-5`}>
            {bubbleText}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}
