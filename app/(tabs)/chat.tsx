import { askGeminiAI } from "@/utils/geminiAI";
import { ChatBubble, TypingBubble } from "@/components/home/ChatBubble";
import { useLanguage } from "@/context/LanguageContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTracking } from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { router } from "expo-router";
import { Trash2, ArrowLeft, Send } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "user" | "flow";
  timestamp: Date;
}

const row1 = [
  "How much did I focus today?",
  "What is my top category?",
  "Summarize my day",
  "Any tips?",
];

const row2 = [
  "Analyze my productivity this week",
  "Give me focus tips",
  "Am I on track?",
  "Recent wins",
];

export default function ChatScreen() {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const { accentColor } = useAppTheme();
  const navigation = useNavigation<any>();
  const { activities, customGoals, categories, deleteActivity } = useTracking();
  const { userName } = useOnboarding();
  const isDark = colorScheme === "dark";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputDisplay, setInputDisplay] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      setMessages([]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  const handleSend = useCallback(async (textOverride?: string) => {
    const textToUse = textOverride || inputDisplay;
    if (textToUse.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToUse,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputDisplay("");
    impact(ImpactFeedbackStyle.Light);
    setIsTyping(true);

    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); startOfWeek.setHours(0, 0, 0, 0);

    const todayActivities = activities.filter((a) => a.start_time >= startOfToday.getTime());
    const weekActivities = activities.filter((a) => a.start_time >= startOfWeek.getTime());

    const totalFocusToday = todayActivities.reduce((s, a) => s + (a.duration || 0), 0);
    const totalFocusWeek = weekActivities.reduce((s, a) => s + (a.duration || 0), 0);

    // Find Top Category
    const catMins: Record<string, number> = {};
    activities.forEach(a => {
      if (a.category) catMins[a.category] = (catMins[a.category] || 0) + (a.duration || 0);
    });
    const topCatId = Object.entries(catMins).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCategory = categories.find(c => c.id === topCatId)?.label;

    // Compute Streak
    const dayMap = new Set(activities.map(a => new Date(a.start_time).toDateString()));
    let streak = 0;
    const check = new Date();
    while (dayMap.has(check.toDateString())) {
      streak++;
      check.setDate(check.getDate() - 1);
    }

    // --- LOCAL INTELLIGENCE FOR TEMPLATES ---
    const getLocalResponse = () => {
      const lowerText = textToUse.toLowerCase();
      
      const formatMins = (m: number) => {
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        const rm = m % 60;
        return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
      };

      if (lowerText.includes("how much did i focus today")) {
        const total = Math.floor(totalFocusToday / 60);
        if (total === 0) return "You haven't started focusing yet today. Let's get into flow!";
        return `You've logged ${formatMins(total)} of focus time today. Great work, ${userName || "there"}!`;
      }

      if (lowerText.includes("top category")) {
        if (!topCategory) return "I don't have enough data yet to determine your top category.";
        return `Your most focused category is ${topCategory}. That's where you're spending the most flow time!`;
      }

      if (lowerText.includes("summarize my day")) {
        if (todayActivities.length === 0) return "Your day hasn't been logged yet. Ready to start a session?";
        const sessionCount = todayActivities.length;
        const summary = todayActivities.map(a => `• ${a.title} (${Math.floor((a.duration || 0)/60)}m)`).join("\n");
        return `You've had ${sessionCount} focus sessions today:\n\n${summary}\n\nTotal: ${formatMins(Math.floor(totalFocusToday/60))}`;
      }

      if (lowerText.includes("analyze my productivity this week")) {
        const total = Math.floor(totalFocusWeek / 60);
        const goalProgress = customGoals.length > 0 
          ? `You are working towards ${customGoals.length} active goals.` 
          : "You haven't set any weekly goals yet.";
        return `This week you've focused for ${formatMins(total)}. ${goalProgress} Consistency is key to long-term growth!`;
      }

      if (lowerText.includes("am i on track")) {
        if (customGoals.length === 0) return "You don't have any active goals. Setting a goal is the first step to staying on track!";
        const progress = customGoals.map(g => {
          const goalLogs = activities.filter(a => a.category === g.categoryId && a.start_time >= g.startDate && a.start_time <= g.endDate);
          const loggedMins = Math.floor(goalLogs.reduce((s, a) => s + (a.duration || 0), 0) / 60);
          const pct = Math.round((loggedMins / g.targetMins) * 100);
          return `• ${g.name}: ${pct}% (${formatMins(loggedMins)} / ${formatMins(g.targetMins)})`;
        }).join("\n");
        return `Here is your current goal progress:\n\n${progress}\n\nKeep pushing, you're doing great!`;
      }

      if (lowerText.includes("recent wins")) {
        const completed = customGoals.filter(g => {
          const goalLogs = activities.filter(a => a.category === g.categoryId && a.start_time >= g.startDate && a.start_time <= g.endDate);
          const loggedMins = Math.floor(goalLogs.reduce((s, a) => s + (a.duration || 0), 0) / 60);
          return loggedMins >= g.targetMins;
        });
        if (completed.length > 0) return `Huge wins! You've already completed these goals: ${completed.map(g => g.name).join(", ")}. Keep that momentum!`;
        if (streak > 2) return `You're on a ${streak}-day streak! That's a major win for your consistency.`;
        return "Every minute of focus is a win. You're building the habit right now!";
      }

      if (lowerText.includes("tips")) {
        const tips = [
          "Try the 25/5 Pomodoro technique to maintain high mental energy.",
          "Clear your physical workspace to reduce visual distractions.",
          "Always define one clear goal before starting a focus session.",
          "Deep work is best done in the first 4 hours of your day.",
          "Turn off all non-essential notifications before you flow."
        ];
        return tips[Math.floor(Math.random() * tips.length)];
      }

      return null;
    };

    const localResponse = getLocalResponse();
    
    let geminiResponse = null;
    if (!localResponse) {
      geminiResponse = await askGeminiAI(textToUse, {
      userName: userName || undefined,
      goals: (customGoals || []).map(g => {
        const goalLogs = activities.filter(a => a.category === g.categoryId && a.start_time >= g.startDate && a.start_time <= g.endDate);
        const loggedMins = Math.floor(goalLogs.reduce((s, a) => s + (a.duration || 0), 0) / 60);
        return { name: g.name, targetMins: g.targetMins, loggedMins, endDate: g.endDate };
      }),
      totalFocusToday,
      totalFocusWeek,
      topCategory,
      streak,
      recentActivities: activities.slice(0, 5).map(a => ({
        title: a.title,
        category: categories.find(c => c.id === a.category)?.label || "Other",
        duration: a.duration || 0
      }))
    });
    }

    const klowkResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: localResponse || geminiResponse || "I'm here to help you stay productive!",
      sender: "flow",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, klowkResponse]);
    setIsTyping(false);
    notification(NotificationFeedbackType.Success);
  }, [inputDisplay, activities, customGoals, userName]);

  const bgColor = isDark ? "#0A0A0A" : "#F1F3F1";
  const inputBg = isDark ? "#1C1C1E" : "#FFFFFF";

  const renderPill = (prompt: string) => (
    <Pressable
      key={prompt}
      onPress={() => {
        impact(ImpactFeedbackStyle.Light);
        setInputDisplay(prompt);
      }}
      className="px-6 py-3.5 rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800"
    >
      <Text className="text-[13px] font-bold text-klowk-black dark:text-white">{prompt}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => navigation.navigate("index")}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              alignItems: "center", justifyContent: "center",
              shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
            }}
          >
            <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
          </Pressable>

          {messages.length > 0 && (
            <Text className="text-lg font-black text-klowk-black dark:text-white">
              Flow
            </Text>
          )}

          <Pressable
            onPress={() => {
              impact(ImpactFeedbackStyle.Medium);
              setMessages([]);
            }}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              alignItems: "center", justifyContent: "center",
              shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
            }}
          >
            <Trash2 size={18} color={isDark ? "#ef4444" : "#ef4444"} />
          </Pressable>
        </View>

        <View className="flex-1">
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <View className="items-center px-8 mb-10">
                <Image
                  source={require("@/assets/images/flow portrait.png")}
                  style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 24 }}
                  contentFit="cover"
                />
                <Text className="text-xl font-bold text-center text-klowk-black dark:text-white leading-8">
                  Ask questions about your focus{"\n"}in plain language
                </Text>
              </View>

              {/* Staggered Quick Prompts */}
              <View className="w-full">
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
                  className="mb-3"
                >
                  {row1.map(renderPill)}
                </ScrollView>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingLeft: 80 }}
                >
                  {row2.map(renderPill)}
                </ScrollView>
              </View>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-6 pt-6"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  fadeAnim={fadeAnim}
                  onUndo={(id) => deleteActivity(id)}
                />
              ))}
              {isTyping && <TypingBubble />}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>

        {/* Input Bar */}
        <View className="px-6 pb-8 pt-2">
          <View 
            style={{ backgroundColor: inputBg }}
            className="flex-row items-center rounded-[32px] px-5 py-3 border border-gray-100 dark:border-zinc-800"
          >
            <TextInput
              className="flex-1 text-base font-semibold text-klowk-black dark:text-white"
              placeholder="Type message"
              placeholderTextColor={isDark ? "#52525b" : "#9ca3af"}
              value={inputDisplay}
              onChangeText={setInputDisplay}
              multiline
            />
            <Pressable
              onPress={() => handleSend()}
              style={{ backgroundColor: accentColor }}
              className="w-10 h-10 rounded-full items-center justify-center ml-2"
            >
              <Send size={18} color={accentColor === "#FFFFFF" ? "#121212" : "white"} />
            </Pressable>
          </View>
          <Text className="text-center text-[10px] font-medium text-gray-400 dark:text-zinc-600 mt-4 px-4">
            AI can make mistakes. Please review important details before acting on them
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
