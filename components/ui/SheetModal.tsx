import { X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal, Pressable, Text, View } from "react-native";

const { height } = Dimensions.get("window");

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function SheetModal({ visible, title, onClose, children }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const sheetSlide = useRef(new Animated.Value(800)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetSlide, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetSlide, { toValue: 800, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)", opacity: backdrop }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <Animated.View style={{ transform: [{ translateY: sheetSlide }] }}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDark ? "#1C1C1E" : "#fff",
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
                padding: 32,
                paddingBottom: 48,
                maxHeight: height * 0.9,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <Text style={{ fontSize: 24, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6", alignItems: "center", justifyContent: "center" }}
                >
                  <X size={18} color={isDark ? "#fff" : "#121212"} />
                </Pressable>
              </View>

              {children}
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
