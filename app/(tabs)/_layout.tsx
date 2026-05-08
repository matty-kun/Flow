import ActionWidget from "@/components/home/ActionWidget";
import { useLanguage } from "@/context/LanguageContext";
import { useTracking } from "@/context/TrackingContext";
import { useSummaryVisible } from "@/context/SummaryVisibleContext";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { ImpactFeedbackStyle } from "expo-haptics";
import { impact } from "@/utils/haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { BarChart3, Home, Plus, Target } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Pressable,
    Text,
    View
} from "react-native";

// Import our tab screens directly
import GoalsScreen from "./goals";
import TabOneScreen from "./index";
import ReportsScreen from "./reports";

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");

// Custom Tab Bar component to ensure it looks exactly like our island
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();
  const { currentActivity } = useTracking();
  const [showSheet, setShowSheet] = useState(false);
  const router = useRouter();

  const { isSummaryVisible } = useSummaryVisible();
  const isTimerRunning = !!currentActivity;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTimerRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isTimerRunning]);

  useEffect(() => {
    Animated.spring(sheetAnim, {
      toValue: showSheet ? 1 : 0,
      tension: 180,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [showSheet]);

  const xOpacity = sheetAnim.interpolate({
    inputRange: [0, 0.5],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const xScale = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
    extrapolate: "clamp",
  });
  const sheetRotate = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const handlePlusTap = () => {
    if (showSheet) {
      impact(ImpactFeedbackStyle.Light);
      setShowSheet(false);
    } else if (isTimerRunning) {
      impact(ImpactFeedbackStyle.Medium);
      router.push("/tracker");
    } else {
      impact(ImpactFeedbackStyle.Medium);
      router.push("/live");
    }
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 1000,
        opacity: isSummaryVisible ? 0 : 1,
        pointerEvents: isSummaryVisible ? "none" : "auto",
      }}
    >
      <ActionWidget
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onTalkToKala={() => { setShowSheet(false); navigation.navigate("chat"); }}
        onLogManually={() => { setShowSheet(false); navigation.navigate("logmanual"); }}
        onStartLiveSession={() => { setShowSheet(false); router.push("/live"); }}
      />

      <View
        style={{
          flex: 1,
          height: 68,
          backgroundColor: isDark
            ? "rgba(28, 28, 30, 0.98)"
            : "rgba(255, 255, 255, 0.98)",
          borderRadius: 34,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 15,
          elevation: 8,
          marginRight: 12,
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? "#FBBF24" : isDark ? "#4b5563" : "#d1d5db";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
              impact(ImpactFeedbackStyle.Light);
            }
          };

          const icons: Record<string, any> = {
            index: Home,
            goals: Target,
            reports: BarChart3,
          };
          const labels: Record<string, string> = {
            index: t("home"),
            goals: t("goals"),
            reports: t("data_tab"),
            chat: t("talk_to_klowk"),
          };

          const label = labels[route.name] || "Home";

          if (route.name === "chat") {
            return (
              <Pressable
                key={route.key}
                onPress={() => router.push("/chat")}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <View style={{
                  width: 26, height: 26, borderRadius: 13,
                  borderWidth: 2,
                  borderColor: isFocused ? "#FBBF24" : "transparent",
                  overflow: "hidden",
                }}>
                  <Image
                    source={require("@/assets/images/flow portrait.png")}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                </View>
                <Text style={{
                  color,
                  fontSize: 8,
                  fontWeight: isFocused ? "900" : "700",
                  marginTop: 4,
                  textTransform: "uppercase",
                }}>Flow</Text>
              </Pressable>
            );
          }

          const Icon = icons[route.name] || Home;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={22} color={color} strokeWidth={isFocused ? 3 : 2} />
              <Text
                style={{
                  color,
                  fontSize: 8,
                  fontWeight: isFocused ? "900" : "700",
                  marginTop: 4,
                  textTransform: "uppercase",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onPress={handlePlusTap}
          onLongPress={() => {
            impact(ImpactFeedbackStyle.Heavy);
            setShowSheet(true);
          }}
          delayLongPress={400}
        >
          <Animated.View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: "#FBBF24",
              elevation: 10,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#FBBF24",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            }}
          >
            <Animated.View
              style={{
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: sheetRotate }],
              }}
            >
              <Plus size={32} color="#fff" strokeWidth={3} />
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colorScheme === "dark" ? "#121212" : "#fff",
      }}
    >
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        tabBarPosition="bottom"
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
        }}
        initialRouteName="index"
      >
        <Tab.Screen name="index" component={TabOneScreen} />
        <Tab.Screen name="goals" component={GoalsScreen} />
        <Tab.Screen name="reports" component={ReportsScreen} />
      </Tab.Navigator>
    </View>
  );
}
