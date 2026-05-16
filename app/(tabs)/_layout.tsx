import { useLanguage } from "@/context/LanguageContext";
import { useSummaryVisible } from "@/context/SummaryVisibleContext";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { ImpactFeedbackStyle } from "expo-haptics";
import { impact } from "@/utils/haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { BarChart3, Home, History as HistoryIcon, Target } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import {
    Dimensions,
    Pressable,
    Text,
    View
} from "react-native";

// Import our tab screens directly
import GoalsScreen from "./goals";
import TabOneScreen from "./index";
import ReportsScreen from "./reports";
import HistoryScreen from "./history";
import ChatScreen from "./chat";

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get("window");

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();
  const { accentColor } = useAppTheme();
  const router = useRouter();
  const { isSummaryVisible } = useSummaryVisible();

  // Hide the navbar when in the Chat tab as requested
  const currentRouteName = state.routes[state.index].name;
  if (currentRouteName === "chat") return null;

  const renderTab = (route: any, index: number) => {
    const isFocused = state.index === index;
    const color = isFocused ? getContrastingColor(accentColor, isDark) : isDark ? "#4b5563" : "#d1d5db";

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
      history: HistoryIcon,
      goals: Target,
      reports: BarChart3,
    };

    const labels: Record<string, string> = {
      index: t("home"),
      history: "History",
      goals: t("goals"),
      reports: t("data_tab"),
    };

    const Icon = icons[route.name] || Home;
    const label = labels[route.name] || route.name;

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
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: 24,
        left: 20,
        right: 20,
        height: 72,
        backgroundColor: isDark
          ? "rgba(28, 28, 30, 0.98)"
          : "rgba(255, 255, 255, 0.98)",
        borderRadius: 36,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 8,
        zIndex: 1000,
        opacity: isSummaryVisible ? 0 : 1,
        pointerEvents: isSummaryVisible ? "none" : "auto",
        paddingHorizontal: 10,
      }}
    >
      {/* Home & History */}
      {renderTab(state.routes[0], 0)}
      {renderTab(state.routes[1], 1)}

      {/* Center Chat Button */}
      <Pressable
        onPress={() => {
          impact(ImpactFeedbackStyle.Medium);
          navigation.navigate("chat");
        }}
        style={{
          alignItems: "center",
          justifyContent: "center",
          marginTop: -55, // Push it higher
        }}
      >
        <Image
          source={require("@/assets/images/flow portrait.png")}
          style={{ width: 60, height: 60, borderRadius: 30 }}
          contentFit="cover"
        />
        <Text
          style={{
            color: isDark ? "#fff" : "#121212",
            fontSize: 9,
            fontWeight: "900",
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: 0.5
          }}
        >
          Ask
        </Text>
      </Pressable>

      {/* Goals & Reports */}
      {renderTab(state.routes[3], 3)}
      {renderTab(state.routes[4], 4)}
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
        <Tab.Screen name="history" component={HistoryScreen} />
        <Tab.Screen name="chat" component={ChatScreen} />
        <Tab.Screen name="goals" component={GoalsScreen} />
        <Tab.Screen name="reports" component={ReportsScreen} />
      </Tab.Navigator>
    </View>
  );
}
