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
    const catMinsTotal: Record<string, number> = {};
    activities.forEach(a => {
      if (a.category) catMinsTotal[a.category] = (catMinsTotal[a.category] || 0) + (a.duration || 0);
    });
    const topCatId = Object.entries(catMinsTotal).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCategory = categories.find(c => c.id === topCatId)?.label;

    // Compute Streak
    const dayMap = new Set(activities.map(a => new Date(a.start_time).toDateString()));
    let streak = 0;
    const check = new Date();
    while (dayMap.has(check.toDateString())) {
      streak++;
      check.setDate(check.getDate() - 1);
    }

    // --- ADVANCED LOCAL INTELLIGENCE ENGINE ---
    const getLocalResponse = () => {
      const lowerText = textToUse.toLowerCase();
      
      const formatMins = (m: number) => {
        if (m <= 0) return "0m";
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        const rm = m % 60;
        return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
      };

      // 1. TODAY INTENT
      if (/(today.*focus|focus.*today|how much.*today|logged.*today|work.*today|time.*today|what did i.*today)/.test(lowerText)) {
        const totalMins = Math.floor(totalFocusToday / 60);
        if (totalMins === 0) {
          return "You haven't logged any focus time today yet. Find a quiet spot, flip your phone face down, and let's get into flow!";
        }
        const sessionCount = todayActivities.length;
        const breakdown = todayActivities.map(a => `• ${a.title || "Session"} (${Math.floor((a.duration || 0)/60)}m)`).join("\n");
        return `You've logged ${formatMins(totalMins)} of focus today across ${sessionCount} sessions:\n\n${breakdown}\n\nExcellent momentum, ${userName || "there"}!`;
      }

      // 2. WEEKLY INTENT
      if (/(week.*focus|focus.*week|this week|productivity.*week|weekly.*summary|how.*this week)/.test(lowerText)) {
        const totalWeekMins = Math.floor(totalFocusWeek / 60);
        if (totalWeekMins === 0) {
          return "You haven't logged any focus sessions yet this week. Every great journey starts with a single 15-minute session!";
        }
        const activeDays = new Set(weekActivities.map(a => new Date(a.start_time).toDateString())).size;
        const avgPerDay = activeDays > 0 ? Math.round(totalWeekMins / activeDays) : 0;
        return `This week you've focused for a total of ${formatMins(totalWeekMins)} across ${activeDays} active days (averaging ${formatMins(avgPerDay)} per day). Keep up the great pace!`;
      }

      // 3. CATEGORY BREAKDOWN INTENT
      if (/(top.*category|favorite.*category|most.*focused|category.*breakdown|where.*spend.*time|category.*stats|categories)/.test(lowerText)) {
        if (activities.length === 0) return "I don't have enough session data yet to analyze your categories.";
        const catMins: Record<string, number> = {};
        let totalMins = 0;
        activities.forEach(a => {
          const m = Math.floor((a.duration || 0) / 60);
          const cId = a.category || "other";
          catMins[cId] = (catMins[cId] || 0) + m;
          totalMins += m;
        });
        if (totalMins === 0) return "You haven't logged enough duration yet to build a category breakdown.";
        
        const sortedCats = Object.entries(catMins).sort((a, b) => b[1] - a[1]);
        const breakdownStr = sortedCats.slice(0, 4).map(([id, mins]) => {
          const label = categories.find(c => c.id === id)?.label || id;
          const pct = Math.round((mins / totalMins) * 100);
          return `• ${label}: ${pct}% (${formatMins(mins)})`;
        }).join("\n");
        
        const topCatLabel = categories.find(c => c.id === sortedCats[0][0])?.label || "Work";
        return `Here is your all-time category breakdown:\n\n${breakdownStr}\n\nYour top flow driver is definitely ${topCatLabel}!`;
      }

      // 4. STREAK INTENT
      if (/(streak|consistency|consecutive|days.*in.*a.*row|how consistent)/.test(lowerText)) {
        if (streak === 0) {
          return "You're starting fresh! Log a focus session today to kick off your consistency streak.";
        }
        const startDay = new Date(); startDay.setDate(startDay.getDate() - streak + 1);
        const dayStr = startDay.toLocaleDateString(undefined, { weekday: "long" });
        return `🔥 You are currently on a ${streak}-day focus streak! You've maintained deep work every single day since ${dayStr}. Consistency is your ultimate superpower!`;
      }

      // 5. GOALS INTENT
      if (/(goal|on.*track|target|achieve|aim|milestone|how are my goals)/.test(lowerText)) {
        if (customGoals.length === 0) {
          return "You don't have any active weekly goals. Setting a target (like 5 hours of Coding or Reading) is the best way to stay on track!";
        }
        const progressStr = customGoals.map(g => {
          const goalLogs = activities.filter(a => a.category === g.categoryId && a.start_time >= g.startDate && a.start_time <= g.endDate);
          const loggedMins = Math.floor(goalLogs.reduce((s, a) => s + (a.duration || 0), 0) / 60);
          const pct = Math.min(100, Math.round((loggedMins / g.targetMins) * 100));
          const checkMark = pct >= 100 ? "✅" : "⏳";
          return `• ${g.name}: ${pct}% ${checkMark}\n  (${formatMins(loggedMins)} / ${formatMins(g.targetMins)})`;
        }).join("\n\n");
        return `Here is your live goal status for this week:\n\n${progressStr}\n\nYou're making solid progress toward your targets!`;
      }

      // 6. PEAK PERFORMANCE / TIME OF DAY INTENT
      if (/(when.*do.*i|time.*of.*day|morning|afternoon|evening|night|peak.*performance|best.*time)/.test(lowerText)) {
        if (activities.length === 0) return "Log a few sessions at different times of day so I can determine your peak performance hours!";
        const counts = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
        let total = 0;
        activities.forEach(a => {
          const hr = new Date(a.start_time).getHours();
          if (hr >= 5 && hr < 12) counts.Morning++;
          else if (hr >= 12 && hr < 17) counts.Afternoon++;
          else if (hr >= 17 && hr < 22) counts.Evening++;
          else counts.Night++;
          total++;
        });
        if (total === 0) return "No timestamp data available.";
        const peak = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        const pct = Math.round((peak[1] / total) * 100);
        return `I analyzed your focus timestamps and found that you log ${pct}% of your sessions in the ${peak[0]}. You hit peak mental clarity during these hours!`;
      }

      // 7. WINS INTENT
      if (/(win|accomplish|proud|success|victory|motivat|inspire|did good)/.test(lowerText)) {
        const completed = customGoals.filter(g => {
          const goalLogs = activities.filter(a => a.category === g.categoryId && a.start_time >= g.startDate && a.start_time <= g.endDate);
          const loggedMins = Math.floor(goalLogs.reduce((s, a) => s + (a.duration || 0), 0) / 60);
          return loggedMins >= g.targetMins;
        });
        const longSessions = activities.filter(a => (a.duration || 0) >= 3600);
        
        let winMsg = "";
        if (completed.length > 0) winMsg += `🎉 You've successfully completed ${completed.length} weekly goals (${completed.map(g => g.name).join(", ")}).\n\n`;
        if (longSessions.length > 0) winMsg += `💪 You've achieved ${longSessions.length} deep work sessions lasting over an hour.\n\n`;
        if (streak > 2) winMsg += `🔥 You're holding a strong ${streak}-day consistency streak.`;
        
        return winMsg ? `Here are your recent major wins:\n\n${winMsg}` : "Every single minute you spend in deep focus is a victory over distraction. Keep building the habit!";
      }

      // 8. TIPS & ADVICE INTENT
      if (/(tip|advice|recommend|suggest|how.*to.*focus|distract|procrastinat|unfocus|can't focus)/.test(lowerText)) {
        const tips = [
          "Try the 25/5 Pomodoro rhythm: Work for 25 minutes, then take a strict 5-minute break away from all screens to recharge your mental battery.",
          "Physical workspace audit: Visual clutter creates subconscious cognitive load. Take 2 minutes to clear your desk before flipping your phone.",
          "One Goal Rule: Never start a timer without deciding on exactly one deliverable. Multi-tasking destroys deep flow state.",
          "Peak Energy Window: Protect your first 3 hours after waking up. Use this pristine energy for your hardest, highest-priority task.",
          "Eliminate friction: Put your phone on 'Do Not Disturb' before you start your flip ritual."
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
          <Text className="text-center text-[10px] font-bold tracking-wider text-gray-400 dark:text-zinc-600 mt-4 px-4 uppercase">
            Your attention is your most valuable asset • Protect your flow
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
