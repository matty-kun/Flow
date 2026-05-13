import CategoryCardPicker from "@/components/category/CategoryCardPicker";
import DatePickerModal from "@/components/forms/DatePickerModal";
import WheelPicker from "@/components/forms/WheelPicker";
import { useLanguage } from "@/context/LanguageContext";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { useTracking } from "@/context/TrackingContext";
import { impact, notification } from "@/utils/haptics";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { Calendar as CalendarIcon, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";


type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AddGoalModal({ visible, onClose }: Props) {
  const { height } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { categories, addCustomGoal, activities } = useTracking();
  const { t } = useLanguage();
  const { accentColor } = useAppTheme();

  const [goalName, setGoalName] = useState("");
  const [targetHours, setTargetHours] = useState(0);
  const [targetMins, setTargetMins] = useState(0);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateType, setActiveDateType] = useState<"start" | "end">("start");
  const hourValues = React.useMemo(() => Array.from({ length: 100 }, (_, i) => `${i}`), []);
  const minValues = React.useMemo(() => Array.from({ length: 60 }, (_, i) => `${i}`), []);

  const sheetSlide = useRef(new Animated.Value(800)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [sheetScrollEnabled, setSheetScrollEnabled] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !selectedCatId) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories]);


  useEffect(() => {
    if (visible) {
      setGoalName("");
      setTargetHours(0);
      setTargetMins(0);
      setStartDate(new Date());
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setEndDate(d);
      Animated.parallel([
        Animated.timing(sheetBackdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(sheetSlide, { toValue: 0, tension: 40, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sheetBackdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetSlide, { toValue: 800, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSave = () => {
    const totalMins = targetHours * 60 + targetMins;
    if (!goalName.trim() || totalMins <= 0 || !selectedCatId) return;
    const fixedEnd = new Date(endDate);
    fixedEnd.setHours(23, 59, 59, 999);
    addCustomGoal({
      id: Date.now().toString(),
      name: goalName.trim(),
      targetMins: totalMins,
      categoryId: selectedCatId,
      startDate: startDate.getTime(),
      endDate: fixedEnd.getTime(),
    });
    notification(NotificationFeedbackType.Success);
    onClose();
  };

  const isFormValid = goalName.trim() && (targetHours * 60 + targetMins) > 0 && selectedCatId;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", opacity: sheetBackdrop }} />
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => { Keyboard.dismiss(); onClose(); }} />
        <Animated.View 
          style={{ 
            position: "absolute", 
            left: 0, 
            right: 0, 
            bottom: 0, 
            transform: [{ translateY: sheetSlide }] 
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isDark ? "#1C1C1E" : "#fff",
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              maxHeight: height * 0.9,
            }}
          >
                {/* Fixed header */}
                <View style={{ paddingHorizontal: 32, paddingTop: 32, paddingBottom: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 24, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>
                      {t("new_goal")}
                    </Text>
                    <Pressable
                      onPress={onClose}
                      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                      style={{ zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={18} color={isDark ? "#fff" : "#121212"} />
                    </Pressable>
                  </View>
                </View>

                {/* Scrollable content — category, target, dates */}
                <ScrollView
                  ref={scrollRef}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 16 }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  scrollEnabled={sheetScrollEnabled}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="none"
                  nestedScrollEnabled
                >
                  {/* Category */}
                  <Text style={{ fontSize: 11, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                    {t("category_label")}
                  </Text>
                  <View style={{ marginBottom: 24 }}>
                    <CategoryCardPicker
                      categories={categories}
                      selectedId={selectedCatId}
                      onSelect={setSelectedCatId}
                      activities={activities}
                    />
                  </View>

                  {/* Target */}
                  <Text style={{ fontSize: 11, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                    Target
                  </Text>
                  <View
                    onTouchStart={() => setSheetScrollEnabled(false)}
                    onTouchEnd={() => setSheetScrollEnabled(true)}
                    onTouchCancel={() => setSheetScrollEnabled(true)}
                    style={{
                      backgroundColor: isDark ? "#2c2c2e" : "#f9fafb",
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isDark ? "#3a3a3c" : "#f3f4f6",
                      marginBottom: 24,
                      flexDirection: "row",
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <WheelPicker
                        values={hourValues}
                        selectedIndex={targetHours}
                        onChange={setTargetHours}
                        itemHeight={32}
                        visibleItems={3}
                        bgColor={isDark ? "#2c2c2e" : "#f9fafb"}
                      />
                      <Text style={{ fontSize: 9, fontWeight: "700", color: isDark ? "#71717a" : "#9ca3af", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center" }}>hrs</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <WheelPicker
                        values={minValues}
                        selectedIndex={targetMins}
                        onChange={setTargetMins}
                        itemHeight={32}
                        visibleItems={3}
                        bgColor={isDark ? "#2c2c2e" : "#f9fafb"}
                      />
                      <Text style={{ fontSize: 9, fontWeight: "700", color: isDark ? "#71717a" : "#9ca3af", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.8, textAlign: "center" }}>min</Text>
                    </View>
                  </View>

                  {/* Date Range */}
                  <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
                    {(["start", "end"] as const).map((type) => (
                      <View key={type} style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
                          {type === "start" ? "Start Date" : "End Date"}
                        </Text>
                        <Pressable
                          onPress={() => { setActiveDateType(type); setShowDatePicker(true); impact(ImpactFeedbackStyle.Light); }}
                          style={{ backgroundColor: isDark ? "#2c2c2e" : "#f9fafb", borderRadius: 20, borderWidth: 1, borderColor: isDark ? "#3a3a3c" : "#f3f4f6", flexDirection: "row", alignItems: "center", height: 50, paddingHorizontal: 14 }}
                        >
                          <CalendarIcon size={14} color={isDark ? "#52525b" : "#9ca3af"} />
                          <Text style={{ flex: 1, marginLeft: 10, fontSize: 14, fontWeight: "700", color: isDark ? "#fff" : "#121212" }}>
                            {(type === "start" ? startDate : endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Bottom bar — name input + save, sits above keyboard */}
                <View
                  style={{
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : 20,
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    backgroundColor: isDark ? "#1C1C1E" : "#fff",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <View style={{
                    flex: 1,
                    backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: isDark ? "#3a3a3c" : "#e5e7eb",
                  }}>
                    <TextInput
                      value={goalName}
                      onChangeText={setGoalName}
                      placeholder="Goal name…"
                      placeholderTextColor={isDark ? "#52525b" : "#d1d5db"}
                      style={{ paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, fontWeight: "600", color: isDark ? "#fff" : "#121212" }}
                      returnKeyType="done"
                      onSubmitEditing={() => Keyboard.dismiss()}
                    />
                  </View>
                  <Pressable
                    onPress={handleSave}
                    disabled={!isFormValid}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 14,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: !isFormValid 
                        ? (isDark ? getContrastingColor(accentColor, isDark) + "26" : "#f3f4f6") 
                        : getContrastingColor(accentColor, isDark),
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "900",
                      color: !isFormValid 
                        ? (isDark ? getContrastingColor(accentColor, isDark) + "66" : "#9ca3af") 
                        : (accentColor === "#18181b" && isDark ? "#121212" : "#fff"),
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
          </Pressable>
        </Animated.View>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        selected={activeDateType === "start" ? startDate : endDate}
        onSelect={(d) => { if (activeDateType === "start") setStartDate(d); else setEndDate(d); }}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
}
