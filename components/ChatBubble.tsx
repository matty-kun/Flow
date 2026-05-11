import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

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
  const isUser = message.sender === "user";
  const [undone, setUndone] = useState(false);

  return (
    <Animated.View
      style={{ opacity: fadeAnim }}
      className={`mb-6 flex-row ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <Image
          source={require("../assets/images/flow portrait.png")}
          style={{ width: 32, height: 32, borderRadius: 10, marginRight: 12, marginTop: -4 }}
          contentFit="cover"
        />
      )}
      <View className="max-w-[80%] flex-col gap-2">
        <View
          className={`p-4 rounded-[24px] ${
            isUser
              ? "bg-klowk-black dark:bg-zinc-800 rounded-tr-none"
              : message.undoActivityId != null && !undone
              ? "bg-amber-400 rounded-tl-none"
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

export const TypingBubble = React.memo(function TypingBubble() {
  return (
    <View className="mb-6 flex-row justify-start">
      <Image
        source={require("../assets/images/flow portrait.png")}
        style={{ width: 32, height: 32, borderRadius: 10, marginRight: 12 }}
        contentFit="cover"
      />
      <View className="bg-gray-50 dark:bg-zinc-900 p-4 rounded-[24px] rounded-tl-none">
        <Text className="text-gray-400 dark:text-zinc-600 font-black">...</Text>
      </View>
    </View>
  );
});
