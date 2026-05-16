import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import React, { useState, useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useAppTheme } from "@/context/ThemeContext";

type Props = {
  message: {
    id: string;
    text: string;
    sender: "user" | "flow";
    undoActivityId?: number;
  };
  fadeAnim: Animated.Value;
  onUndo?: (activityId: number) => void;
};

export const ChatBubble = React.memo(function ChatBubble({ message, fadeAnim, onUndo }: Props) {
  const { accentColor } = useAppTheme();
  const isUser = message.sender === "user";
  const [undone, setUndone] = useState(false);

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={`mb-6 flex-row ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <Image
          source={require("../../assets/images/flow portrait.png")}
          style={{ width: 32, height: 32, borderRadius: 10, marginRight: 12, marginTop: -4 }}
          contentFit="cover"
        />
      )}
      <View className="max-w-[80%] flex-col gap-2">
        <View
          style={(!isUser && message.undoActivityId != null && !undone) ? { backgroundColor: accentColor } : undefined}
          className={`p-4 rounded-[24px] ${
            isUser
              ? "bg-klowk-black dark:bg-zinc-800 rounded-tr-none"
              : message.undoActivityId != null && !undone
              ? "rounded-tl-none"
              : "bg-gray-50 dark:bg-zinc-900 rounded-tl-none"
          }`}
        >
          <Text
            className={`text-sm font-semibold leading-5 ${
              isUser
                ? "text-white"
                : message.undoActivityId != null && !undone
                ? "text-white"
                : "text-klowk-black dark:text-white"
            }`}
          >
            {undone ? "Log removed." : message.text}
          </Text>
        </View>
        {!isUser && message.undoActivityId != null && !undone && (
          <Pressable
            onPress={() => {
              setUndone(true);
              onUndo?.(message.undoActivityId!);
            }}
            className="self-start px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
          >
            <Text className="text-xs font-bold text-gray-500 dark:text-zinc-400">Undo</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
});

const Dot = ({ animValue, index }: { animValue: Animated.Value; index: number }) => {
  const opacity = animValue.interpolate({
    inputRange: [0, index * 0.25, (index + 1) * 0.25, 1],
    outputRange: [0.2, 0.2, 1, 0.2],
  });
  const translateY = animValue.interpolate({
    inputRange: [0, index * 0.25, (index + 1) * 0.25, 1],
    outputRange: [0, 0, -4, 0],
  });
  return (
    <Animated.Text style={{ opacity, transform: [{ translateY }], fontSize: 24, fontWeight: "900", color: "#a1a1aa", marginHorizontal: 2, lineHeight: 24 }}>
      •
    </Animated.Text>
  );
};

export const TypingBubble = React.memo(function TypingBubble() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [anim]);

  return (
    <View className="mb-6 flex-row justify-start items-center">
      <Image
        source={require("../../assets/images/flow portrait.png")}
        style={{ width: 32, height: 32, borderRadius: 10, marginRight: 12 }}
        contentFit="cover"
      />
      <View className="bg-gray-50 dark:bg-zinc-900 px-5 py-3 rounded-[24px] rounded-tl-none flex-row items-center justify-center">
        <Dot animValue={anim} index={1} />
        <Dot animValue={anim} index={2} />
        <Dot animValue={anim} index={3} />
      </View>
    </View>
  );
});
