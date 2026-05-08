import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

type Props = {
  progress: number; // 0 to 1
  color: string;
  trackColor?: string;
  height?: number;
  className?: string;
};

export default function ProgressBar({
  progress,
  color,
  trackColor,
  height = 4,
  className,
}: Props) {
  const { colorScheme } = useColorScheme();
  const defaultTrack = colorScheme === "dark" ? "#27272a" : "#f3f4f6";

  return (
    <View
      className={`w-full overflow-hidden ${className ?? ""}`}
      style={{
        height,
        borderRadius: height,
        backgroundColor: trackColor ?? defaultTrack,
      }}
    >
      <View
        style={{
          height,
          borderRadius: height,
          width: `${Math.min(100, Math.max(0, progress * 100))}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
