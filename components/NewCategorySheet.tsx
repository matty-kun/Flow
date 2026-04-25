import { CategoryIcon } from "@/components/CategoryIcon";
import { useTracking } from "@/context/TrackingContext";
import { impact, notification } from "@/utils/haptics";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Check, Image as ImageIcon, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const CAT_ICONS = [
  "briefcase", "heart", "book-open", "dumbbell", "coffee", "music",
  "gamepad", "camera", "plane", "home", "wallet", "star", "flame", "brain", "palette",
];
const CAT_COLORS = [
  "#FBBF24", "#f97316", "#ef4444", "#f43f5e", "#ec4899",
  "#a855f7", "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4",
  "#14b8a6", "#10b981", "#22c55e", "#84cc16",
  "#78716c", "#6b7280",
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
};

export default function NewCategorySheet({ visible, onClose, onCreated }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { addCategory } = useTracking();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("briefcase");
  const [color, setColor] = useState("#FBBF24");
  const [customImageUri, setCustomImageUri] = useState<string | undefined>();

  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName("");
      setIcon("briefcase");
      setColor("#FBBF24");
      setCustomImageUri(undefined);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCustomImageUri(result.assets[0].uri);
      impact(ImpactFeedbackStyle.Light);
    }
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addCategory(trimmed, icon, color, customImageUri);
    notification(NotificationFeedbackType.Success);
    const newId = trimmed.toLowerCase().replace(/\s+/g, "-");
    onCreated?.(newId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", opacity: backdropAnim }} />
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} />
        <Animated.View style={{ position: "absolute", left: 0, right: 0, bottom: 0, transform: [{ translateY: slideAnim }] }}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: isDark ? "#1C1C1E" : "#fff", borderTopLeftRadius: 40, borderTopRightRadius: 40 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 32, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
              {/* Header */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>New Category</Text>
                <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6", alignItems: "center", justifyContent: "center" }}>
                  <X size={18} color={isDark ? "#fff" : "#121212"} />
                </Pressable>
              </View>

              {/* Name */}
              <Text style={{ fontSize: 10, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Category Name</Text>
              <View style={{ backgroundColor: isDark ? "#2c2c2e" : "#f9fafb", borderRadius: 20, borderWidth: 1, borderColor: isDark ? "#3a3a3c" : "#f3f4f6", marginBottom: 24 }}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Study, Anime, Gym..."
                  placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                  autoFocus
                  style={{ padding: 18, fontSize: 15, fontWeight: "700", color: isDark ? "#fff" : "#121212" }}
                />
              </View>

              {/* Icon */}
              <Text style={{ fontSize: 10, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {/* Upload image button */}
                  <Pressable
                    onPress={pickImage}
                    style={{ width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: customImageUri ? 2 : 1, borderColor: customImageUri ? color : isDark ? "#3a3a3c" : "#f3f4f6", backgroundColor: isDark ? "#2c2c2e" : "#f9fafb" }}
                  >
                    {customImageUri ? (
                      <Image source={{ uri: customImageUri }} style={{ width: 48, height: 48 }} />
                    ) : (
                      <ImageIcon size={20} color={isDark ? "#52525b" : "#9ca3af"} />
                    )}
                  </Pressable>
                  {CAT_ICONS.map((i) => (
                    <Pressable
                      key={i}
                      onPress={() => { setIcon(i); setCustomImageUri(undefined); impact(ImpactFeedbackStyle.Light); }}
                      style={{ width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: !customImageUri && icon === i ? color : isDark ? "#2c2c2e" : "#f9fafb", borderWidth: 1, borderColor: !customImageUri && icon === i ? color : isDark ? "#3a3a3c" : "#f3f4f6" }}
                    >
                      <CategoryIcon name={i} size={20} color={!customImageUri && icon === i ? "#fff" : isDark ? "#52525b" : "#9ca3af"} />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Color */}
              <Text style={{ fontSize: 10, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32 }}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {CAT_COLORS.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => { setColor(c); impact(ImpactFeedbackStyle.Light); }}
                      style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: color === c ? (isDark ? "#fff" : "#121212") : "transparent" }}
                    >
                      {color === c && <Check size={16} color="#fff" />}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Create */}
              <Pressable
                onPress={handleCreate}
                disabled={!name.trim()}
                style={{ paddingVertical: 18, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: name.trim() ? "#FBBF24" : (isDark ? "#2c2c2e" : "#f3f4f6") }}
              >
                <Text style={{ fontSize: 15, fontWeight: "900", color: name.trim() ? "#fff" : (isDark ? "#52525b" : "#9ca3af"), textTransform: "uppercase", letterSpacing: 1 }}>
                  Create Category
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
