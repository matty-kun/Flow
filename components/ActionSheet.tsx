import { impact, notification } from "@/utils/haptics";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, Text, View } from "react-native";

export type ActionSheetAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: React.ReactNode;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetAction[];
};

export default function ActionSheet({ visible, onClose, title, actions = [] }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showModal, setShowModal] = React.useState(visible);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

  return (
    <Modal visible={showModal} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", opacity: backdropAnim }}>
        <Pressable style={{ flex: 1 }} onPress={() => { impact(ImpactFeedbackStyle.Light); onClose(); }} />
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-t-[32px] px-6 pt-4 pb-10"
          >
            <View className="self-center w-10 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full mb-6" />

            {title && (
              <Text className="text-xl font-black text-klowk-black dark:text-white italic mb-5">
                {title}
              </Text>
            )}

            {actions.map((action, i) => (
              <React.Fragment key={action.label}>
                {i > 0 && <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 my-1" />}
                <Pressable
                  onPress={() => {
                    if (action.destructive) notification(NotificationFeedbackType.Warning);
                    else impact(ImpactFeedbackStyle.Medium);
                    onClose();
                    action.onPress();
                  }}
                  style={{ borderRadius: 16, overflow: "hidden" }}
                >
                  {({ pressed }) => (
                    <View
                      className={`flex-row items-center justify-center py-3.5 px-1 rounded-2xl ${
                        pressed
                          ? action.destructive
                            ? "bg-red-50 dark:bg-red-900/10"
                            : "bg-gray-50 dark:bg-zinc-800"
                          : ""
                      }`}
                    >
                      {action.icon && <View style={{ marginRight: 16 }}>{action.icon}</View>}
                      <Text
                        className={`text-base font-bold ${
                          action.destructive
                            ? "text-red-500"
                            : "text-klowk-black dark:text-white"
                        }`}
                      >
                        {action.label}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </React.Fragment>
            ))}

            <View className="h-[1px] bg-gray-50 dark:bg-zinc-800 my-2" />
            <Pressable onPress={() => { impact(ImpactFeedbackStyle.Light); onClose(); }} style={{ borderRadius: 16, overflow: "hidden" }}>
              {({ pressed }) => (
                <View className={`items-center justify-center py-3.5 rounded-2xl ${pressed ? "bg-gray-50 dark:bg-zinc-800" : ""}`}>
                  <Text className="text-base font-bold text-gray-400 dark:text-zinc-600">Cancel</Text>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
