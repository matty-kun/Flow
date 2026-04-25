import { CategoryIcon } from "@/components/CategoryIcon";
import ActionSheet from "@/components/ActionSheet";
import CategoryDetailSheet from "@/components/CategoryDetailSheet";
import EditCategorySheet from "@/components/EditCategorySheet";
import NewCategorySheet from "@/components/NewCategorySheet";
import { Activity, Category, useTracking } from "@/context/TrackingContext";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import { ArrowLeft, ChevronRight, Edit2, MoreHorizontal, Plus, Trash2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CategoriesScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    activities,
    categories,
    deleteActivity,
    deleteCategory,
    duplicateActivity,
  } = useTracking();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [actionCategoryId, setActionCategoryId] = useState<string | null>(null);

  const categoryStats = useMemo(() => {
    return categories.map((cat: Category) => {
      const logs = activities.filter((a: Activity) => a.category === cat.id);
      const totalSecs = logs.reduce(
        (sum: number, a: Activity) => sum + (a.duration || 0),
        0,
      );
      const totalMins = Math.floor(totalSecs / 60);
      return { ...cat, totalMins, sessionCount: logs.length };
    });
  }, [activities, categories]);

  const formatTime = (totalMins: number) => {
    if (totalMins === 0) return "--";
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins > 0 ? mins + "m" : ""}`.trim() : `${mins}m`;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#fff" }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#18181b" : "#f9fafb",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
        </Pressable>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: isDark ? "#fff" : "#121212",
          }}
        >
          Categories
        </Text>
        <Pressable
          onPress={() => {
            impact(ImpactFeedbackStyle.Medium);
            setShowAddCategory(true);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? "#18181b" : "#f9fafb",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} color="#FBBF24" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Category List */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24 }}>
          {categoryStats.map((stat: any, i: number) => (
            <Pressable
              key={stat.id}
              onPress={() => {
                impact(ImpactFeedbackStyle.Light);
                setSelectedCategory(stat.id);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 16,
                borderBottomWidth: i < categoryStats.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? "#27272a" : "#f3f4f6",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${stat.color}22`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <CategoryIcon
                  name={stat.iconName}
                  size={22}
                  color={stat.color}
                  customImageUri={stat.customImageUri}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: isDark ? "#fff" : "#1a1a1a",
                    marginBottom: 2,
                  }}
                >
                  {stat.label}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#71717a" : "#9ca3af",
                    fontWeight: "600",
                  }}
                >
                  {stat.sessionCount === 0
                    ? "No sessions"
                    : `${stat.sessionCount} ${stat.sessionCount === 1 ? "session" : "sessions"}`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: isDark ? "#fff" : "#1a1a1a" }}>
                    {formatTime(stat.totalMins)}
                  </Text>
                  <Pressable
                    onPress={() => { impact(ImpactFeedbackStyle.Medium); setActionCategoryId(stat.id); }}
                    hitSlop={10}
                    style={{ padding: 2 }}
                  >
                    <MoreHorizontal size={16} color={isDark ? "#52525b" : "#9ca3af"} />
                  </Pressable>
                </View>
                <ChevronRight size={16} color={isDark ? "#3f3f46" : "#d1d5db"} strokeWidth={2.5} />
              </View>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Category Detail Slide-In Overlay */}
      <NewCategorySheet visible={showAddCategory} onClose={() => setShowAddCategory(false)} />
      <EditCategorySheet category={editingCategory} onClose={() => setEditingCategory(null)} />
      <ActionSheet
        visible={actionCategoryId !== null}
        onClose={() => setActionCategoryId(null)}
        title="Category Actions"
        actions={[
          {
            label: "Edit category",
            icon: <Edit2 size={20} color={isDark ? "#e5e7eb" : "#121212"} />,
            onPress: () => {
              const cat = categories.find((c: Category) => c.id === actionCategoryId);
              setEditingCategory(cat || null);
              setActionCategoryId(null);
            },
          },
          {
            label: "Delete category",
            icon: <Trash2 size={20} color="#ef4444" />,
            destructive: true,
            onPress: () => {
              Alert.alert("Delete category?", "Sessions logged here will remain but won't be grouped.", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => { deleteCategory(actionCategoryId!); setActionCategoryId(null); } },
              ]);
            },
          },
        ]}
      />

      <CategoryDetailSheet
        categoryId={selectedCategory}
        categories={categories}
        activities={activities}
        onClose={() => setSelectedCategory(null)}
        onDeleteActivity={deleteActivity}
        onDuplicateActivity={duplicateActivity}
      />
    </SafeAreaView>
  );
}
