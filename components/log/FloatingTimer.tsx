import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { useTracking } from "@/context/TrackingContext";
import { impact, notification } from "@/utils/haptics";
import { sendLocalNotification } from "@/utils/notifications";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BUBBLE_WIDTH = 120;
const BUBBLE_HEIGHT = 48;

export default function FloatingTimer() {
  const router = useRouter();
  const { accentColor } = useAppTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { currentActivity, isMinimized, setIsMinimized } = useTracking();
  const [elapsed, setElapsed] = React.useState(0);
  const hasAlerted = useRef(false);

  // Reanimated shared values — all on UI thread
  const translateX = useSharedValue(SCREEN_WIDTH - BUBBLE_WIDTH - 20);
  const translateY = useSharedValue(100);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  // JS-side refs for drag offset (read inside PanResponder callbacks)
  const lastOffset = useRef({ x: SCREEN_WIDTH - BUBBLE_WIDTH - 20, y: 100 });
  const isDragging = useRef(false);
  const onPressRef = useRef<() => void>(() => {});

  // Show / hide animation
  useEffect(() => {
    if (isMinimized && currentActivity) {
      opacity.value = 1;
      scale.value = withSpring(1, { damping: 18, stiffness: 400 });
    } else {
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [isMinimized, currentActivity]);

  // Reset alert when activity changes
  useEffect(() => {
    hasAlerted.current = false;
  }, [currentActivity?.id]);

  // Elapsed timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (currentActivity) {
      setElapsed(Math.floor((Date.now() - currentActivity.start_time) / 1000));
      interval = setInterval(() => {
        const secs = Math.floor(
          (Date.now() - currentActivity.start_time) / 1000,
        );
        setElapsed(secs);
        const target = currentActivity.target_duration;
        if (target && !hasAlerted.current && secs >= target) {
          hasAlerted.current = true;
          // notification(NotificationFeedbackType.Success);
          sendLocalNotification(
            "Time's up! ⏱",
            `You completed "${currentActivity.title}". Great work!`,
          );
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentActivity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        isDragging.current = false;
      },
      onPanResponderMove: (_, g) => {
        isDragging.current = true;
        translateX.value = lastOffset.current.x + g.dx;
        translateY.value = lastOffset.current.y + g.dy;
      },
      onPanResponderRelease: (_, g) => {
        if (!isDragging.current) {
          runOnJS(onPressRef.current)();
          return;
        }
        let nx = lastOffset.current.x + g.dx;
        let ny = lastOffset.current.y + g.dy;
        nx = Math.max(10, Math.min(nx, SCREEN_WIDTH - BUBBLE_WIDTH - 10));
        ny = Math.max(50, Math.min(ny, SCREEN_HEIGHT - BUBBLE_HEIGHT - 60));

        translateX.value = withSpring(nx, { damping: 18, stiffness: 180 });
        translateY.value = withSpring(ny, { damping: 18, stiffness: 180 });
        lastOffset.current = { x: nx, y: ny };
      },
    }),
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!currentActivity) return null;

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const h = Math.floor(m / 60);

  let timeStr = "";
  const targetSecs = currentActivity.target_duration || 0;
  if (targetSecs > 0) {
    const remaining = Math.max(0, targetSecs - elapsed);
    const rm = Math.floor(remaining / 60);
    const rs = remaining % 60;
    const rh = Math.floor(rm / 60);
    timeStr =
      rh > 0
        ? `${rh}:${(rm % 60).toString().padStart(2, "0")}:${rs.toString().padStart(2, "0")}`
        : `${rm.toString().padStart(2, "0")}:${rs.toString().padStart(2, "0")}`;
  } else {
    timeStr =
      h > 0
        ? `${h}:${(m % 60).toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const handlePress = () => {
    impact(ImpactFeedbackStyle.Medium);
    setIsMinimized(false);
    router.push("/tracker");
  };
  onPressRef.current = handlePress;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: "absolute",
          zIndex: 9999,
          width: BUBBLE_WIDTH,
          height: BUBBLE_HEIGHT,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={() => {
          impact(ImpactFeedbackStyle.Medium);
          setIsMinimized(false);
          router.push("/tracker");
        }}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 24,
          backgroundColor: isDark ? "#1C1C1E" : "#fff",
          borderWidth: 1.5,
          borderColor: getContrastingColor(accentColor, isDark),
          shadowColor: getContrastingColor(accentColor, isDark),
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
          elevation: 10,
          paddingHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Image
          source={require("../../assets/images/focus flow.png")}
          style={{ width: 28, height: 28, marginRight: 8 }}
          contentFit="contain"
        />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 8,
              fontWeight: "900",
              color: isDark ? "#71717a" : "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: -0.5,
            }}
          >
            {currentActivity.title}
          </Text>
          <Text
            style={{
              color: isDark ? "#fff" : "#121212",
              fontWeight: "900",
              fontSize: 14,
              lineHeight: 18,
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            }}
          >
            {timeStr}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
