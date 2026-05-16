import { Image } from "expo-image";
import { router } from "expo-router";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  Home,
  MessageCircle,
  Smartphone,
  Target,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/context/ThemeContext";

const sections = [
  {
    icon: Home,
    title: "Home",
    body: "Your daily dashboard. See today's total focus time, your current streak, recent sessions, and quick-start shortcuts — all at a glance.",
  },
  {
    icon: Target,
    title: "Goals",
    body: "Set weekly focus targets per category. Flow will track your progress and show how close you are to hitting each goal by the end of the week.",
  },
  {
    icon: BarChart3,
    title: "Reports & Data",
    body: "Dive into your productivity patterns. View daily, weekly, and monthly breakdowns, category distributions, and streaks to understand your habits.",
  },
  {
    icon: MessageCircle,
    title: "Talk to Flow",
    body: "Your built-in AI productivity coach. Ask Flow for advice, session summaries, habit insights, or just to think out loud about your work.",
  },
  {
    icon: Smartphone,
    title: "Flip to Focus",
    body: "Ready for deep work? With the app open, lay your phone upside down (face down) on your desk. Flow instantly triggers a distraction-free focus timer. Flip it back over to pause or finish.",
  },
  {
    icon: Bell,
    title: "Notifications",
    body: "Flow sends a notification when your session timer hits your goal duration. You can pause, resume, or stop the session right from the notification.",
  },
];

function SectionCard({
  icon: Icon,
  title,
  body,
  isLast,
}: {
  icon: any;
  title: string;
  body: string;
  isLast: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: isDark ? accentColor + "1E" : accentColor + "1A",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={accentColor} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: isDark ? "#ffffff" : "#18181b",
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 20,
            color: isDark ? "#a1a1aa" : "#52525b",
            fontWeight: "400",
          }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

export default function HelpGuideScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const bg = isDark ? "#0A0A0A" : "#f8f8f8";
  const cardBg = isDark ? "#18181A" : "#ffffff";
  const border = isDark ? "transparent" : "#e4e4e7";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 4, marginRight: 4 }}
        >
          <ChevronLeft size={28} color={accentColor} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: "700",
            color: isDark ? "#fff" : "#18181b",
            textAlign: "center",
            marginRight: 36,
          }}
        >
          Help Guide
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Hero Card */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: border,
              flexDirection: "row",
              alignItems: "center",
              padding: 20,
              overflow: "hidden",
            }}
          >
            <Image
              source={require("../assets/images/think flow.png")}
              style={{
                width: 130,
                height: 130,
                borderRadius: 22,
                marginRight: 16,
                transform: [{ scaleX: -1 }],
              }}
              contentFit="contain"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: isDark ? "#fff" : "#18181b",
                  lineHeight: 26,
                  marginBottom: 6,
                }}
              >
                Using Flow
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#71717a" : "#71717a",
                  lineHeight: 18,
                }}
              >
                Quick guides for getting the most out of Flow
              </Text>
              <View
                style={{
                  marginTop: 10,
                  alignSelf: "flex-start",
                  backgroundColor: accentColor + "1E",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: accentColor + "4D",
                }}
              >
                <Text
                  style={{ fontSize: 9, fontWeight: "700", color: accentColor, letterSpacing: 0.5 }}
                >
                  6 SECTIONS BELOW
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section Cards */}
        <View
          style={{
            marginHorizontal: 16,
            backgroundColor: cardBg,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: border,
            overflow: "hidden",
          }}
        >
          {sections.map((s, i) => (
            <SectionCard
              key={s.title}
              icon={s.icon}
              title={s.title}
              body={s.body}
              isLast={i === sections.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
