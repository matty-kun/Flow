import { CategoryIcon } from "@/components/category/CategoryIcon";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/context/TrackingContext";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

type Props = {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** "wrap" lays pills in a flex-wrap grid; "scroll" uses a horizontal ScrollView (default) */
  layout?: "scroll" | "wrap";
};

export default function CategoryPillScroller({ categories, selectedId, onSelect, layout = "scroll" }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  const pills = categories.map((cat: Category) => {
    const isSelected = selectedId === cat.id;
    return (
      <Pressable
        key={cat.id}
        onPress={() => { onSelect(cat.id); impact(ImpactFeedbackStyle.Light); }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 14,
          marginRight: layout === "wrap" ? 0 : 10,
          marginBottom: layout === "wrap" ? 8 : 0,
          marginEnd: layout === "wrap" ? 8 : 0,
          backgroundColor: isSelected ? cat.color : isDark ? "#18181b" : "#f9fafb",
          borderWidth: 1.5,
          borderColor: isSelected ? cat.color : "transparent",
        }}
      >
        <CategoryIcon
          name={cat.iconName}
          size={14}
          color={isSelected ? "#fff" : cat.color}
          customImageUri={cat.customImageUri}
        />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 13,
            fontWeight: "700",
            color: isSelected ? "#fff" : isDark ? "#a1a1aa" : "#9ca3af",
          }}
        >
          {t(cat.id as any) || cat.label}
        </Text>
      </Pressable>
    );
  });

  if (layout === "wrap") {
    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {pills}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      directionalLockEnabled
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingRight: 6 }}
    >
      <View style={{ flexDirection: "row" }}>{pills}</View>
    </ScrollView>
  );
}
