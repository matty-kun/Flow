import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Save, Calendar as CalendarIcon, Clock, ChevronDown, Check } from "lucide-react-native";
import { useTracking, Category } from "@/context/TrackingContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useColorScheme } from "nativewind";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { CategoryIcon } from "@/components/category/CategoryIcon";
import DateTimePicker from "@react-native-community/datetimepicker";
import WheelPicker from "@/components/forms/WheelPicker";

export default function LogManualScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { categories, activities, addManualActivity, editActivity } = useTracking();
  const { accentColor } = useAppTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (editId) {
      const activity = activities.find(a => a.id === parseInt(editId));
      if (activity) {
        setTitle(activity.title);
        setCategory(activity.category || "");
        setDuration(Math.floor((activity.duration || 0) / 60).toString());
        setDescription(activity.description || "");
        setDate(new Date(activity.start_time));
      }
    }
  }, [editId, activities]);

  const handleSave = async () => {
    if (!title || !category || !duration) {
      impact(ImpactFeedbackStyle.Medium);
      return;
    }

    impact(ImpactFeedbackStyle.Heavy);
    const durationMins = parseInt(duration);
    
    if (editId) {
      await editActivity(
        parseInt(editId),
        title,
        category,
        durationMins * 60,
        description,
        date
      );
    } else {
      await addManualActivity(
        title,
        category,
        durationMins * 60,
        description,
        date
      );
    }
    router.back();
  };

  const bg = isDark ? "#0A0A0A" : "#F8F9FA";
  const cardBg = isDark ? "#121212" : "#FFFFFF";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft color={isDark ? "#fff" : "#000"} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#fff" : "#000" }]}>
          {editId ? "Edit Session" : "Manual Log"}
        </Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: accentColor }]}>
          <Save size={18} color="white" />
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
            placeholder="What were you doing?"
            placeholderTextColor="#666"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.divider} />

          <Text style={styles.label}>CATEGORY</Text>
          <TouchableOpacity 
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            style={styles.pickerTrigger}
          >
            <View className="flex-row items-center">
              {category ? (
                <CategoryIcon 
                  name={categories.find(c => c.id === category)?.iconName || "tag"} 
                  size={16} 
                  color={categories.find(c => c.id === category)?.color || accentColor} 
                />
              ) : <View className="w-4 h-4" />}
              <Text style={[styles.pickerValue, { color: category ? (isDark ? "#fff" : "#000") : "#666" }]}>
                {categories.find(c => c.id === category)?.label || "Select Category"}
              </Text>
            </View>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>

          {showCategoryPicker && (
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setCategory(cat.id); setShowCategoryPicker(false); }}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: category === cat.id ? cat.color + "20" : "transparent",
                      borderColor: category === cat.id ? cat.color : "#ddd"
                    }
                  ]}
                >
                  <CategoryIcon name={cat.iconName} size={12} color={category === cat.id ? cat.color : "#666"} />
                  <Text style={[styles.categoryChipText, { color: category === cat.id ? cat.color : "#666" }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.label}>DURATION</Text>
          <View style={styles.durationContainer}>
            <View style={styles.durationColumn}>
              <WheelPicker
                values={Array.from({ length: 100 }, (_, i) => i.toString())}
                selectedIndex={Math.floor(parseInt(duration || "0") / 60)}
                onChange={(idx) => {
                  const mins = parseInt(duration || "0") % 60;
                  setDuration((idx * 60 + mins).toString());
                }}
                itemHeight={60}
                visibleItems={3}
                bgColor={cardBg}
              />
              <Text style={styles.durationLabel}>HRS</Text>
            </View>

            <View style={styles.durationColumn}>
              <WheelPicker
                values={Array.from({ length: 60 }, (_, i) => i.toString())}
                selectedIndex={parseInt(duration || "0") % 60}
                onChange={(idx) => {
                  const hrs = Math.floor(parseInt(duration || "0") / 60);
                  setDuration((hrs * 60 + idx).toString());
                }}
                itemHeight={60}
                visibleItems={3}
                bgColor={cardBg}
              />
              <Text style={styles.durationLabel}>MIN</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>DATE</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.pickerTrigger}>
                <Text style={{ color: isDark ? "#fff" : "#000", fontWeight: "bold", fontSize: 16 }}>
                  {date.toLocaleDateString()}
                </Text>
                <CalendarIcon size={18} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setShowDatePicker(false);
                if (d) setDate(d);
              }}
            />
          )}

          <View style={styles.divider} />

          <Text style={styles.label}>NOTES</Text>
          <TextInput
            style={[styles.input, { color: isDark ? "#fff" : "#000", height: 80 }]}
            placeholder="How did it go?"
            placeholderTextColor="#666"
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "900",
    marginLeft: 6,
    fontSize: 13,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    color: "#888",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.1)",
    marginVertical: 20,
  },
  durationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    gap: 20,
  },
  durationColumn: {
    flex: 1,
    alignItems: "center",
  },
  durationPill: {
    width: "100%",
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  durationInput: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    width: "100%",
  },
  durationLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#666",
    letterSpacing: 1,
  },
  pickerTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  vDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(128,128,128,0.1)",
    marginLeft: 20,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
});
