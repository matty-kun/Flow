import { isGeminiNanoAvailable, initGeminiNano, askGeminiNano } from "@/utils/geminiNano";
import { askGeminiAI } from "@/utils/geminiAI";
import { ChatBubble, TypingBubble } from "@/components/home/ChatBubble";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTracking } from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { router } from "expo-router";
import { ArrowLeft, CircleHelp, Send } from "lucide-react-native";
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

import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "user" | "flow";
  timestamp: Date;
  undoActivityId?: number;
}

const quickPrompts = [
  "Read 1h this morning",
  "How much did I focus today?",
  "How much did I study yesterday?",
  "Am I on track with my goals this week?",
];

export default function ChatScreen() {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const { activities, customGoals, categories, addManualActivity, deleteActivity } = useTracking();
  const { userName } = useOnboarding();
  const isDark = colorScheme === "dark";

  const initialGreeting = `Hey ${userName || "there"}! I'm Flow, your personal focus companion. How can I help you stay on track today?`;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: initialGreeting,
      sender: "flow",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [inputDisplay, setInputDisplay] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleInputChange = useCallback((text: string) => {
    setInputDisplay(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setInputText(text), 150);
  }, []);
  const [nanoReady, setNanoReady] = useState(false);

  useEffect(() => {
    isGeminiNanoAvailable().then(async (available) => {
      if (available) {
        const ok = await initGeminiNano();
        setNanoReady(ok);
      }
    });
  }, []);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const parseLogFromInput = useCallback((rawText: string) => {
    const text = rawText.trim();
    const input = text.toLowerCase();

    const durationRegex =
      /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/g;
    const durationStripRegex =
      /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)/gi;
    let match: RegExpExecArray | null;
    let totalSeconds = 0;
    while ((match = durationRegex.exec(input)) !== null) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      if (unit.startsWith("h")) totalSeconds += Math.round(value * 3600);
      else totalSeconds += Math.round(value * 60);
    }

    if (totalSeconds <= 0) return null;
    if (totalSeconds < 60) totalSeconds = 60;

    let title = "";
    const onMatch = text.match(/\b(?:on|for)\s+(.+)$/i);
    if (onMatch?.[1]) {
      title = onMatch[1].trim().replace(/[.?!]+$/, "");
    }

    let category = "";
    if (/\bwork\b/.test(input)) category = "work";
    else if (/\bstudy\b/.test(input)) category = "study";
    else if (/\bhealth\b/.test(input)) category = "health";
    else if (/\bleisure\b/.test(input)) category = "leisure";
    else if (/\bother\b/.test(input)) category = "other";

    if (!category) {
      if (/(code|coding|dev|project|client|meeting|office)/.test(input))
        category = "work";
      else if (/(read|course|learn|school|exam|homework)/.test(input))
        category = "study";
      else if (/(gym|workout|run|exercise|walk|yoga)/.test(input))
        category = "health";
      else if (/(game|movie|show|music|rest|relax|family|friends)/.test(input))
        category = "leisure";
      else category = "other";
    }

    if (!title) {
      const explicitCategoryFirst = input.match(
        /^(work|study|health|leisure|other)\s+/,
      );
      const cleaned = text
        .replace(/^((work|study|health|leisure|other)\s+)/i, "")
        .replace(durationStripRegex, "")
        .replace(/\b(?:on|for)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned.length > 0 && !explicitCategoryFirst) {
        title = cleaned.replace(/[.?!]+$/, "");
      }
    }

    if (!title) return null;

    const now = new Date();
    let customDate: Date | undefined;

    if (/\byesterday\b/.test(input)) {
      customDate = new Date(now);
      customDate.setDate(customDate.getDate() - 1);
    } else if (
      /\ba\s+week\s+ago\b|\b1\s+week\s+ago\b|\blast\s+week\b/.test(input)
    ) {
      customDate = new Date(now);
      customDate.setDate(customDate.getDate() - 7);
    } else {
      const daysAgoMatch = input.match(/\b(\d+)\s+days?\s+ago\b/);
      if (daysAgoMatch) {
        const days = parseInt(daysAgoMatch[1], 10);
        if (!Number.isNaN(days) && days > 0) {
          customDate = new Date(now);
          customDate.setDate(customDate.getDate() - days);
        }
      }
    }

    return { title, category, totalSeconds, customDate };
  }, []);

  const getKlowkResponse = useCallback((text: string) => {
    const input = text.toLowerCase().trim();

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const endOfYesterday = new Date(startOfToday.getTime() - 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const isLoggingIntent =
      /(worked|studied|focused|focus|logged|track|spent)\b/.test(input) &&
      /(\d+(\.\d+)?\s?(h|hr|hrs|hour|hours|m|min|mins|minute|minutes))/.test(
        input,
      );

    if (isLoggingIntent) {
      return "Got it, that looks like a time log entry. You can use Flow State for a running timer or Manual Log to save it exactly.";
    }

    const isHistoryQuery =
      /(how much|total|history|did i|spent|time|hours|mins|minutes|today|yesterday|week|month|category)/.test(
        input,
      );

    if (isHistoryQuery) {
      let start = startOfToday.getTime();
      let end = now.getTime();
      let periodLabel = "today";

      if (input.includes("yesterday")) {
        start = startOfYesterday.getTime();
        end = endOfYesterday.getTime();
        periodLabel = "yesterday";
      } else if (input.includes("week")) {
        start = startOfWeek.getTime();
        end = endOfWeek.getTime();
        periodLabel = "this week";
      } else if (input.includes("month")) {
        start = startOfMonth.getTime();
        end = endOfMonth.getTime();
        periodLabel = "this month";
      }

      const categoryMatch = customGoals
        ?.map((g) => g.categoryId)
        .find((c) => input.includes(c.toLowerCase()));

      const filtered = activities.filter((a) => {
        const inWindow = a.start_time >= start && a.start_time <= end;
        if (!inWindow) return false;
        if (categoryMatch) return a.category === categoryMatch;
        return true;
      });

      const totalSecs = filtered.reduce((sum, a) => sum + (a.duration || 0), 0);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);

      if (categoryMatch) {
        return `For ${periodLabel}, you logged ${hours}h ${mins}m in ${categoryMatch}.`;
      }

      // Build per-category breakdown
      const breakdown = categories
        .map((cat) => {
          const secs = filtered
            .filter((a) => a.category === cat.id)
            .reduce((sum, a) => sum + (a.duration || 0), 0);
          return { label: cat.label, secs };
        })
        .filter((c) => c.secs > 0)
        .sort((a, b) => b.secs - a.secs);

      if (breakdown.length === 0) {
        return `You haven't logged anything ${periodLabel === "today" ? "today" : `for ${periodLabel}`} yet.`;
      }

      const breakdownLines = breakdown
        .map((c) => `  · ${c.label}: ${Math.floor(c.secs / 3600)}h ${Math.floor((c.secs % 3600) / 60)}m`)
        .join("\n");

      return `For ${periodLabel}, you logged ${hours}h ${mins}m total:\n\n${breakdownLines}`;
    }

    const isForecastIntent =
      /(forecast|predict|goal|goals|will i|on track|target)/.test(input);
    if (isForecastIntent) {
      const activeGoals = (customGoals || []).filter(
        (g) => g.endDate >= Date.now() && g.startDate <= Date.now(),
      );

      if (activeGoals.length === 0) {
        return "You don't have any active goals right now. Head over to the Goals tab and create one — then I can give you a proper forecast!";
      }

      const DAY_MS = 1000 * 60 * 60 * 24;
      const nowMs = Date.now();

      const lines = activeGoals.slice(0, 5).map((goal) => {
        const goalActivities = activities.filter(
          (a) =>
            a.category === goal.categoryId &&
            a.start_time >= goal.startDate &&
            a.start_time <= Math.min(goal.endDate, nowMs),
        );
        const loggedMins = Math.floor(
          goalActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 60,
        );

        const totalDays = Math.max(
          1,
          Math.ceil((goal.endDate - goal.startDate) / DAY_MS),
        );
        const elapsedDays = Math.max(
          1,
          Math.min(totalDays, Math.ceil((nowMs - goal.startDate) / DAY_MS)),
        );
        const daysLeft = Math.max(0, totalDays - elapsedDays);
        const expectedByNow = Math.floor(
          (goal.targetMins * elapsedDays) / totalDays,
        );
        const projectedTotal = Math.floor((loggedMins / elapsedDays) * totalDays);
        const pct = Math.min(100, Math.round((loggedMins / goal.targetMins) * 100));

        const loggedHrs = (loggedMins / 60).toFixed(1);
        const targetHrs = (goal.targetMins / 60).toFixed(1);
        const projectedHrs = (projectedTotal / 60).toFixed(1);

        let status = "";
        let advice = "";
        if (pct >= 100) {
          status = "✅ Completed";
          advice = "You've already hit this one!";
        } else if (loggedMins >= expectedByNow) {
          const ahead = loggedMins - expectedByNow;
          status = "🟢 On track";
          advice = `You're ${Math.round(ahead / 60 * 10) / 10}h ahead of pace. Keep it up!`;
        } else {
          const behind = expectedByNow - loggedMins;
          const dailyCatchUp = daysLeft > 0 ? Math.ceil(behind / daysLeft) : behind;
          status = "🔴 Behind";
          advice = `You're ${Math.round(behind / 60 * 10) / 10}h behind. Log about ${dailyCatchUp}m/day for the next ${daysLeft} day${daysLeft !== 1 ? "s" : ""} to catch up.`;
        }

        return `${goal.name}\n  ${status} — ${loggedHrs}h of ${targetHrs}h logged (${pct}%)\n  Projected: ${projectedHrs}h by end\n  ${advice}`;
      });

      const allOnTrack = lines.every((l) => l.includes("🟢") || l.includes("✅"));
      const summary = allOnTrack
        ? "Looking good — you're on track with all your goals! 🐌💨"
        : "Here's where things stand with your goals this week:";

      return `${summary}\n\n${lines.join("\n\n")}`;
    }

    if (/(privacy|local|offline|cloud|data)/.test(input)) {
      return "Flow analyzes your activity data locally on your device. Nothing needs to leave your phone for these basic insights.";
    }

    if (input.includes("hello") || input.includes("hi")) {
      return "Hey! I can help you log time, check your history, and see if you are on track with goals.";
    }

    return 'Try something like: "Read 1h this morning", "How much did I focus today?", or "Am I on track with goals this week?"';
  }, [activities, customGoals, categories]);

  const handleSend = useCallback(async () => {
    if (inputText.trim() === "") return;

    const rawInput = inputText;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: rawInput,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setInputDisplay("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    impact(ImpactFeedbackStyle.Light);

    // Simulate Flow typing
    setIsTyping(true);
    const parsedLog = parseLogFromInput(rawInput);

    if (parsedLog) {
      try {
        const newId = await addManualActivity(
          parsedLog.title,
          parsedLog.category,
          parsedLog.totalSeconds,
          undefined,
          parsedLog.customDate,
        );
        const hrs = Math.floor(parsedLog.totalSeconds / 3600);
        const mins = Math.floor((parsedLog.totalSeconds % 3600) / 60);
        const durationLabel = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        const dateLabel = parsedLog.customDate
          ? parsedLog.customDate.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : "today";
        const klowkResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `Logged: ${durationLabel} for "${parsedLog.title}" under ${parsedLog.category} (${dateLabel}).`,
          sender: "flow",
          timestamp: new Date(),
          undoActivityId: newId,
        };
        setMessages((prev) => [...prev, klowkResponse]);
        setIsTyping(false);
        notification(NotificationFeedbackType.Success);
        return;
      } catch {
        const failResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I understood that as a log, but I could not save it right now. Please try again.",
          sender: "flow",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, failResponse]);
        setIsTyping(false);
        return;
      }
    }

    // Build context for Gemini AI
    const nowMs = Date.now();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(); startOfWeek.setDate(new Date().getDate() - new Date().getDay()); startOfWeek.setHours(0, 0, 0, 0);
    const totalFocusToday = activities
      .filter((a) => a.start_time >= startOfToday.getTime())
      .reduce((s, a) => s + (a.duration || 0), 0);
    const totalFocusWeek = activities
      .filter((a) => a.start_time >= startOfWeek.getTime())
      .reduce((s, a) => s + (a.duration || 0), 0);
    const activeGoals = (customGoals || [])
      .filter((g) => g.endDate >= nowMs && g.startDate <= nowMs)
      .map((g) => ({
        name: g.name,
        targetMins: g.targetMins,
        endDate: g.endDate,
        loggedMins: Math.floor(
          activities
            .filter((a) => a.category === g.categoryId && a.start_time >= g.startDate && a.start_time <= nowMs)
            .reduce((s, a) => s + (a.duration || 0), 0) / 60
        ),
      }));

    const geminiResponse = await askGeminiAI(rawInput, {
      userName: userName || undefined,
      goals: activeGoals,
      totalFocusToday,
      totalFocusWeek,
    });
    const responseText = geminiResponse ?? (nanoReady ? await askGeminiNano(rawInput) : null) ?? getKlowkResponse(rawInput);
    const klowkResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: "flow",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, klowkResponse]);
    setIsTyping(false);
    notification(NotificationFeedbackType.Success);
  }, [inputText, activities, customGoals, userName, nanoReady, parseLogFromInput, getKlowkResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickPrompt = useCallback((prompt: string) => {
    impact(ImpactFeedbackStyle.Light);
    setInputDisplay(prompt);
    setInputText(prompt);
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 44 : 0}
      >
        <View className="flex-1 bg-white dark:bg-klowk-black">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900"
            >
              <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
            </Pressable>
            <View className="items-center">
              <View className="flex-row items-center">
                <Text className="text-lg font-black text-klowk-black dark:text-white">
                  {t("talk_to_klowk")}
                </Text>
                <View className="ml-2 px-1.5 py-0.5 rounded bg-amber-400">
                  <Text className="text-[9px] font-black text-white">BETA</Text>
                </View>
              </View>
            </View>
            <Pressable
              onPress={() => router.push("/chat-help")}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900"
            >
              <CircleHelp size={20} color={isDark ? "#fff" : "#121212"} />
            </Pressable>
          </View>

          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6 pt-6 bg-white dark:bg-klowk-black"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
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

            <View className="h-10" />
          </ScrollView>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <View className="px-6 pb-2 gap-2 items-end">
              {quickPrompts.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => handleQuickPrompt(prompt)}
                  className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 self-end"
                >
                  <Text className="text-xs font-bold text-klowk-black dark:text-white">{prompt}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Input Bar */}
          <View className="p-6 border-t border-gray-50 dark:border-zinc-800 pb-10 bg-white dark:bg-klowk-black">
            <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900 rounded-[30px] px-5 py-3 border border-gray-100 dark:border-zinc-800">
              <TextInput
                className="flex-1 text-sm font-bold text-klowk-black dark:text-white"
                placeholder={t("ask_anything")}
                placeholderTextColor={isDark ? "#52525b" : "#9ca3af"}
                value={inputDisplay}
                onChangeText={handleInputChange}
                multiline
              />
              {inputDisplay.trim().length > 0 && (
                <Pressable
                  onPress={handleSend}
                  className="w-10 h-10 rounded-full bg-amber-400 items-center justify-center ml-2"
                >
                  <Send size={18} color="white" />
                </Pressable>
              )}
            </View>
            <Text className="text-center text-[8px] font-bold text-gray-300 dark:text-zinc-700 mt-4 uppercase tracking-[1px]">
              {t("klowk_mistakes")}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
