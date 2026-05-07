import { impact } from "@/utils/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ImpactFeedbackStyle } from "expo-haptics";
import { useColorScheme } from "nativewind";
import React, { memo, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, Text, View } from "react-native";

type Props = {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  bgColor?: string;
  itemHeight?: number;
  visibleItems?: number;
};

type ItemProps = { label: string; selected: boolean; height: number; isDark: boolean };

const WheelItem = memo(({ label, selected, height, isDark }: ItemProps) => (
  <View style={{ height, alignItems: "center", justifyContent: "center" }}>
    <Text
      style={{
        fontSize: 18,
        fontWeight: "800",
        color: selected
          ? isDark ? "#fff" : "#121212"
          : isDark ? "#3f3f46" : "#c7c7cc",
      }}
    >
      {label}
    </Text>
  </View>
));

export default function WheelPicker({
  values,
  selectedIndex,
  onChange,
  bgColor,
  itemHeight = 44,
  visibleItems = 3,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const resolvedBg = bgColor ?? (isDark ? "#1c1c1e" : "#f9fafb");

  const [liveIndex, setLiveIndex] = useState(selectedIndex);
  const translateY = useRef(new Animated.Value(-selectedIndex * itemHeight)).current;
  const currentOffset = useRef(-selectedIndex * itemHeight);
  const lastIndex = useRef(selectedIndex);

  useEffect(() => {
    if (lastIndex.current === selectedIndex) return;
    lastIndex.current = selectedIndex;
    const target = -selectedIndex * itemHeight;
    currentOffset.current = target;
    Animated.spring(translateY, { toValue: target, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    setLiveIndex(selectedIndex);
  }, [selectedIndex, itemHeight]);

  const clampIndex = (offset: number) =>
    Math.max(0, Math.min(values.length - 1, Math.round(-offset / itemHeight)));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.stopAnimation((v) => {
          currentOffset.current = v;
          translateY.setValue(v);
        });
      },
      onPanResponderMove: (_, { dy }) => {
        const next = currentOffset.current + dy;
        const minOffset = -(values.length - 1) * itemHeight;
        const clamped = Math.max(minOffset, Math.min(0, next));
        translateY.setValue(clamped);
        const idx = clampIndex(clamped);
        if (idx !== lastIndex.current) {
          lastIndex.current = idx;
          setLiveIndex(idx);
          impact(ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const raw = currentOffset.current + dy;
        const minOffset = -(values.length - 1) * itemHeight;
        // momentum: project 120ms forward
        const projected = raw + vy * 120;
        const snappedIndex = Math.max(0, Math.min(values.length - 1, Math.round(-projected / itemHeight)));
        const target = -snappedIndex * itemHeight;
        currentOffset.current = target;
        lastIndex.current = snappedIndex;
        Animated.spring(translateY, { toValue: target, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
        setLiveIndex(snappedIndex);
        onChange(snappedIndex);
      },
    })
  ).current;

  const centerY = Math.floor(visibleItems / 2) * itemHeight;
  const containerHeight = itemHeight * visibleItems;

  return (
    <View
      style={{ height: containerHeight, overflow: "hidden", alignSelf: "stretch" }}
      {...panResponder.panHandlers}
    >
      {/* Selection highlight */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: centerY,
          height: itemHeight,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
        }}
      />

      <Animated.View
        style={{
          transform: [{ translateY: Animated.add(translateY, new Animated.Value(centerY)) }],
        }}
      >
        {values.map((v, i) => (
          <WheelItem key={v} label={v} selected={liveIndex === i} height={itemHeight} isDark={isDark} />
        ))}
      </Animated.View>

      <LinearGradient
        colors={[resolvedBg, `${resolvedBg}00`]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: itemHeight }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[`${resolvedBg}00`, resolvedBg]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: itemHeight }}
        pointerEvents="none"
      />
    </View>
  );
}
