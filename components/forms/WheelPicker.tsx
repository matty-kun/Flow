import { impact } from "@/utils/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { ImpactFeedbackStyle } from "expo-haptics";
import { useColorScheme } from "nativewind";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
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

const COPIES = 5;
const CENTER_COPY = Math.floor(COPIES / 2);

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

  const N = values.length;
  const extValues = useMemo(
    () => Array.from({ length: COPIES }, () => values).flat(),
    [values],
  );

  const toExtIndex = (valIdx: number) => CENTER_COPY * N + valIdx;

  const [liveExtIndex, setLiveExtIndex] = useState(() => toExtIndex(selectedIndex));
  const translateY = useRef(new Animated.Value(-toExtIndex(selectedIndex) * itemHeight)).current;
  const currentOffset = useRef(-toExtIndex(selectedIndex) * itemHeight);
  const lastExtIndex = useRef(toExtIndex(selectedIndex));

  useEffect(() => {
    if (lastExtIndex.current % N === selectedIndex) return;
    const extIdx = toExtIndex(selectedIndex);
    lastExtIndex.current = extIdx;
    const target = -extIdx * itemHeight;
    currentOffset.current = target;
    Animated.spring(translateY, { toValue: target, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    setLiveExtIndex(extIdx);
  }, [selectedIndex, itemHeight]);

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
        const minOffset = -(extValues.length - 1) * itemHeight;
        const bounded = Math.max(minOffset, Math.min(0, next));
        translateY.setValue(bounded);
        const extIdx = Math.max(0, Math.min(extValues.length - 1, Math.round(-bounded / itemHeight)));
        if (extIdx !== lastExtIndex.current) {
          lastExtIndex.current = extIdx;
          setLiveExtIndex(extIdx);
          impact(ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        const raw = currentOffset.current + dy;
        const projected = raw + vy * 120;
        const minOffset = -(extValues.length - 1) * itemHeight;
        const extIdx = Math.max(0, Math.min(extValues.length - 1, Math.round(-projected / itemHeight)));
        const valIdx = ((extIdx % N) + N) % N;
        const target = -extIdx * itemHeight;

        Animated.spring(translateY, { toValue: target, useNativeDriver: true, damping: 20, stiffness: 200 }).start(() => {
          // silently re-center to the middle copy so there's always room to scroll either way
          const normalized = CENTER_COPY * N + valIdx;
          translateY.setValue(-normalized * itemHeight);
          currentOffset.current = -normalized * itemHeight;
          lastExtIndex.current = normalized;
          setLiveExtIndex(normalized);
        });

        onChange(valIdx);
      },
    }),
  ).current;

  const centerY = Math.floor(visibleItems / 2) * itemHeight;
  const containerHeight = itemHeight * visibleItems;

  return (
    <View
      style={{ height: containerHeight, overflow: "hidden", alignSelf: "stretch" }}
      {...panResponder.panHandlers}
    >
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
        {extValues.map((v, i) => (
          <WheelItem key={i} label={v} selected={i === liveExtIndex} height={itemHeight} isDark={isDark} />
        ))}
      </Animated.View>

      <LinearGradient
        colors={[resolvedBg, "transparent"]}
        locations={[0, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: itemHeight }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", resolvedBg]}
        locations={[0, 1]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: itemHeight }}
        pointerEvents="none"
      />
    </View>
  );
}
