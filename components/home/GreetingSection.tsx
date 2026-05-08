import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { formatDuration } from "@/utils/time";
import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";

const FORECAST_MESSAGES: Record<string, Record<string, string>> = {
  on_track: {
    en: "Slow and steady wins the race! We're right on trail — keep leaving that silver streak!",
    tl: "Dahan-dahan pero sigurado! On track tayo — keep leaving that silver streak!",
  },
  behind: {
    en: "The path is getting long. Even a snail gets there with consistent steps. Try one more focused hour.",
    tl: "Medyo nahuhuli na tayo. Kahit mabagal, consistent lang — try one more focused hour.",
  },
  burnout: {
    en: "Even snails tuck in sometimes. You've been crawling hard — pull back and rest a bit.",
    tl: "Kahit ang pinaka-sipag ay nagpapahinga. Nagtatrabaho ka nang husto — magpahinga muna.",
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
      "{time} of focus today — that's how legends are made.",
      "You showed up for {time} today. Consistency is everything.",
    ],
    tl: [
      "Na-focus ka na ng {time} ngayon. Stellar work!",
      "{time} ng pure focus ngayon. Keep the momentum!",
      "{time} na locked in ngayon. Binubuo mo ng something great.",
      "Crushed {time} of deep work ngayon. Flow state achieved.",
      "{time} of focus ngayon — ganyan gawa ang mga legends.",
      "Nandito ka ng {time} ngayon. Consistency is everything.",
    ],
  },
  ready: {
    en: [
      "Ready for a deep focus session? I'm here to help you track your wins.",
      "Your next breakthrough is one session away. Let's get started.",
      "Every great work day starts with the first focus block. Ready?",
      "The best time to focus was yesterday. The second best is right now.",
      "Silence the noise. Lock in. Let's build something today.",
      "Your goals are waiting. One focused session can change everything.",
    ],
    tl: [
      "Ready na for a deep focus session? Nandito ako to help you track your wins.",
      "One session away na ang iyong next breakthrough. Tara na.",
      "Every great work day starts with the first focus block. Ready ka na?",
      "The best time to focus was yesterday. The second best — right now.",
      "I-silence ang lahat. Lock in. Mag-build tayo ngayon.",
      "Your goals are waiting. One focused session can change everything.",
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
}: Props) {
  const { t, language } = useLanguage();
  const { userName } = useOnboarding();
  const bubbleText = klowkForecastStatus === "no_goal"
    ? (() => {
        const lang = language === "tl" ? "tl" : "en";
        const dayIdx = new Date().getDate();
        if (todayMinsTotal > 0) {
          const pool = FLOW_SAYINGS.win[lang];
          return pool[dayIdx % pool.length].replace("{time}", formatDuration(Math.floor(todayMinsTotal / 60)));
        }
        const pool = FLOW_SAYINGS.ready[lang];
        return pool[dayIdx % pool.length];
      })()
    : (FORECAST_MESSAGES[klowkForecastStatus]?.[language === "tl" ? "tl" : "en"] ?? klowkForecastMessage);

  return (
    <View className="px-6 mb-8 mt-3">
      <View className="flex-row items-center mb-1">
        <Text className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-[1.5px]">
          {dayOfWeek}, {dayOfMonth}
        </Text>
      </View>
      <Text className="text-[26px] font-black text-klowk-black dark:text-white mb-10">
        {t(greetingKey as any)}{" "}
        <Text className="text-amber-400">{userName || "User"}!</Text>
      </Text>

      <View className="relative items-center justify-center -mt-12">
        <View className="absolute -left-6 -right-6 h-[56px] bg-klowk-orange" style={{ top: "52%" }} />
        <View className="flex-row items-center justify-between mt-9">
          <View className="w-40 h-40 items-center justify-center -mt-10">
            <Image
              source={require("../../assets/video/flow moving.webp")}
              style={{ width: 175, height: 175 }}
              contentFit="contain"
              autoplay
            />
          </View>
          <View className="relative bg-white dark:bg-zinc-900 p-4 rounded-[32px] shadow-sm w-[55%] border border-gray-50 dark:border-zinc-800 -mt-6 ml-2">
            <View className="absolute -left-2 top-6 w-4 h-4 bg-white dark:bg-zinc-900 border-l border-b border-gray-50 dark:border-zinc-800 rotate-[45deg]" />
            <Text className="text-xs text-klowk-black dark:text-white font-semibold leading-5">
              {bubbleText}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
