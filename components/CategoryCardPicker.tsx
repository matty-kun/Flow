import React, { useRef, useMemo } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Activity, Category } from "@/context/TrackingContext";
import { useColorScheme } from "nativewind";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { ChevronDown, Check } from "lucide-react-native";

type Props = {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  activities?: Activity[];
};

export default function CategoryCardPicker({ categories, selectedId, onSelect, activities = [] }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [open, setOpen] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setOpen(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 600, duration: 200, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const catStats = useMemo(() => {
    const map = new Map<string, { totalSecs: number; sessions: number }>();
    for (const a of activities) {
      if (!a.category || !a.duration) continue;
      const s = map.get(a.category) || { totalSecs: 0, sessions: 0 };
      map.set(a.category, { totalSecs: s.totalSecs + a.duration, sessions: s.sessions + 1 });
    }
    return map;
  }, [activities]);

  const formatSecs = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const selected = categories.find((c) => c.id === selectedId) || categories[0];
  if (!selected) return null;

  return (
    <>
      <Pressable
        onPress={() => { impact(ImpactFeedbackStyle.Light); openSheet(); }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: `${selected.color}12`,
          borderRadius: 20,
          padding: 16,
          borderWidth: 1.5,
          borderColor: `${selected.color}35`,
        }}
      >
        <View style={{ backgroundColor: `${selected.color}22`, borderRadius: 14, padding: 10, marginRight: 12 }}>
          <CategoryIcon name={selected.iconName} size={20} color={selected.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: selected.color }}>
            {selected.label}
          </Text>
          {(() => {
            const stats = catStats.get(selected.id);
            if (stats && stats.sessions > 0) {
              return (
                <Text style={{ fontSize: 10, color: isDark ? "#71717a" : "#9ca3af", fontWeight: "700", marginTop: 2, letterSpacing: 0.3 }}>
                  {formatSecs(stats.totalSecs)} · {stats.sessions} {stats.sessions === 1 ? "session" : "sessions"}
                </Text>
              );
            }
            return (
              <Text style={{ fontSize: 10, color: isDark ? "#71717a" : "#9ca3af", fontWeight: "700", textTransform: "uppercase", marginTop: 2, letterSpacing: 0.5 }}>
                Tap to change
              </Text>
            );
          })()}
        </View>
        <ChevronDown size={16} color={selected.color} />
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeSheet}>
        {/* Backdrop — stays fixed, only fades */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: backdropAnim }]}
          pointerEvents="box-none"
        >
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>

        {/* Sheet — slides up independently */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? "#121212" : "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              paddingBottom: 48,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: isDark ? "#3f3f46" : "#e5e7eb",
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 20,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "#9ca3af",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Choose Category
            </Text>
            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {categories.map((cat) => {
                const isSelected = cat.id === selectedId;
                const stats = catStats.get(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      impact(ImpactFeedbackStyle.Light);
                      onSelect(cat.id);
                      closeSheet();
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginHorizontal: 20,
                      marginBottom: 8,
                      padding: 14,
                      borderRadius: 18,
                      backgroundColor: isSelected ? `${cat.color}15` : isDark ? "#1c1c1e" : "#f9fafb",
                      borderWidth: 1.5,
                      borderColor: isSelected ? `${cat.color}55` : isDark ? "#27272a" : "#f3f4f6",
                    }}
                  >
                    <View style={{ backgroundColor: `${cat.color}20`, borderRadius: 10, padding: 8, marginRight: 12 }}>
                      <CategoryIcon name={cat.iconName} size={16} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: isSelected ? cat.color : isDark ? "#fff" : "#121212",
                          marginBottom: stats ? 3 : 0,
                        }}
                      >
                        {cat.label}
                      </Text>
                      {stats && stats.sessions > 0 ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: isSelected ? cat.color : "#9ca3af" }}>
                            {formatSecs(stats.totalSecs)}
                          </Text>
                          <Text style={{ fontSize: 9, color: isDark ? "#52525b" : "#d1d5db" }}>•</Text>
                          <Text style={{ fontSize: 10, fontWeight: "700", color: isDark ? "#52525b" : "#9ca3af" }}>
                            {stats.sessions} {stats.sessions === 1 ? "session" : "sessions"}
                          </Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 10, fontWeight: "700", color: isDark ? "#52525b" : "#d1d5db" }}>
                          No sessions yet
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Check size={14} color={cat.color} strokeWidth={3} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}
