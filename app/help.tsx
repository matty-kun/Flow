import { Image } from "expo-image";
import { router } from "expo-router";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ClipboardList,
  Home,
  MessageCircle,
  RotateCcw,
  Target,
  Timer,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AMBER = "#f59e0b";

const sections = [
  {
    icon: Home,
    title: "Home",
    body: "Your daily dashboard. See today's total focus time, your current streak, recent sessions, and quick-start shortcuts — all at a glance.",
  },
  {
    icon: Timer,
    title: "Live Session",
    body: "Tap the + button to start a timed focus session. Set a category, an optional goal duration, and go. The floating bubble keeps the timer visible while you use other apps.",
  },
  {
    icon: ClipboardList,
    title: "Manual Log",
    body: "Forgot to start the timer? Long-press + and choose 'Log manually' to add a past session by entering the start time, end time, and category.",
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
    icon: RotateCcw,
    title: "Shake to Undo",
    body: "Just logged a session by mistake? Shake your phone within a few seconds to instantly undo the last entry — no menus needed.",
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
          backgroundColor: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.10)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={AMBER} strokeWidth={2} />
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
          <ChevronLeft size={28} color={AMBER} />
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
                  backgroundColor: "rgba(245,158,11,0.12)",
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderWidth: 1,
                  borderColor: "rgba(245,158,11,0.3)",
                }}
              >
                <Text
                  style={{ fontSize: 9, fontWeight: "700", color: AMBER, letterSpacing: 0.5 }}
                >
                  8 SECTIONS BELOW
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Start Here tip */}
        <View style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: AMBER,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginLeft: 4,
            }}
          >
            Start Here
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 6 }}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: border,
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}
          >
            {[
              "1. Set up your first session — tap the big amber + button.",
              "2. Track your time with the live timer, or log past sessions manually.",
              "3. Open Reports to see your weekly patterns and streaks.",
            ].map((step, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: i < 2 ? 12 : 0,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: "rgba(245,158,11,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color: AMBER }}>
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    lineHeight: 20,
                    color: isDark ? "#d4d4d8" : "#3f3f46",
                    fontWeight: "500",
                  }}
                >
                  {step.slice(3)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section label */}
        <View style={{ paddingHorizontal: 16, marginTop: 20, marginBottom: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: AMBER,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginLeft: 4,
            }}
          >
            All Features
          </Text>
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
