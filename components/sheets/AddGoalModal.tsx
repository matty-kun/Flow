import CategoryCardPicker from "@/components/category/CategoryCardPicker";
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
  editingGoalId?: string | null;
};

export default function AddGoalModal({ visible, onClose, editingGoalId }: Props) {
  const { height } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { categories, addCustomGoal, editCustomGoal, customGoals, activities } = useTracking();
  const { t } = useLanguage();
  const { accentColor } = useAppTheme();

  const [goalName, setGoalName] = useState("");
  const [targetHours, setTargetHours] = useState(0);
  const [targetMins, setTargetMins] = useState(0);
  const [selectedCatId, setSelectedCatId] = useState<string>("");
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
      if (editingGoalId) {
        const g = customGoals.find(goal => goal.id === editingGoalId);
        if (g) {
          setGoalName(g.name);
          setTargetHours(Math.floor(g.targetMins / 60));
          setTargetMins(g.targetMins % 60);
          setSelectedCatId(g.categoryId);
        }
      } else {
        setGoalName("");
        setTargetHours(0);
        setTargetMins(0);
      }
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
  }, [visible, editingGoalId]);

  const handleSave = () => {
    const totalMins = targetHours * 60 + targetMins;
    if (!goalName.trim() || totalMins <= 0 || !selectedCatId) return;

    // Calculate current week range (Monday to Sunday)
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    if (editingGoalId) {
      editCustomGoal({
        id: editingGoalId,
        name: goalName.trim(),
        targetMins: totalMins,
        categoryId: selectedCatId,
        startDate: startOfWeek.getTime(),
        endDate: endOfWeek.getTime(),
      });
    } else {
      addCustomGoal({
        id: Date.now().toString(),
        name: goalName.trim(),
        targetMins: totalMins,
        categoryId: selectedCatId,
        startDate: startOfWeek.getTime(),
        endDate: endOfWeek.getTime(),
      });
    }
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
              backgroundColor: isDark ? "#1A1A1A" : "#fff",
              borderTopLeftRadius: 44,
              borderTopRightRadius: 44,
              maxHeight: height * 0.92,
            }}
          >
            <View className="items-center py-3">
              <View className="w-12 h-1 bg-gray-300 dark:bg-zinc-800 rounded-full" />
            </View>

            <View className="px-8 pb-6 flex-row justify-between items-center">
              <View>
                <Text className="text-2xl font-black text-klowk-black dark:text-white">
                  {editingGoalId ? "Edit Goal" : "New Goal"}
                </Text>
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  {editingGoalId ? "Update your goal parameters" : "Set your weekly focus target"}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-900 items-center justify-center"
              >
                <X size={20} color={isDark ? "#fff" : "#121212"} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollRef}
              className="flex-grow-0"
              contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: keyboardHeight > 0 ? keyboardHeight + 100 : 160 }}
              showsVerticalScrollIndicator={false}
              scrollEnabled={sheetScrollEnabled}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* Goal Name */}
              <View className="mb-8">
                <Text className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-1">GOAL NAME</Text>
                <View className="bg-gray-100 dark:bg-black/40 rounded-3xl border border-gray-200 dark:border-zinc-800 px-6 py-5">
                  <TextInput
                    value={goalName}
                    onChangeText={setGoalName}
                    placeholder="e.g. Learn Spanish, Read 30 pages, Workout..."
                    placeholderTextColor={isDark ? "#52525b" : "#9ca3af"}
                    className="text-lg font-black text-klowk-black dark:text-white"
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* Category */}
              <View className="mb-8">
                <Text className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-1">GOAL CATEGORY</Text>
                <CategoryCardPicker
                  categories={categories}
                  selectedId={selectedCatId}
                  onSelect={setSelectedCatId}
                  activities={activities}
                />
              </View>

              {/* Weekly Target */}
              <View className="mb-8">
                <Text className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-3 ml-1">WEEKLY HOUR TARGET</Text>
                <View
                  onTouchStart={() => setSheetScrollEnabled(false)}
                  onTouchEnd={() => setSheetScrollEnabled(true)}
                  onTouchCancel={() => setSheetScrollEnabled(true)}
                  className="bg-gray-100 dark:bg-black/40 rounded-3xl border border-gray-200 dark:border-zinc-800 flex-row p-4"
                >
                  <View className="flex-1 items-center">
                    <WheelPicker
                      values={hourValues}
                      selectedIndex={targetHours}
                      onChange={setTargetHours}
                      itemHeight={40}
                      visibleItems={3}
                      bgColor={isDark ? "#00000066" : "#F3F4F6"}
                    />
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Hours</Text>
                  </View>
                  <View className="w-[1px] h-full bg-gray-200 dark:bg-zinc-800 my-4" />
                  <View className="flex-1 items-center">
                    <WheelPicker
                      values={minValues}
                      selectedIndex={targetMins}
                      onChange={setTargetMins}
                      itemHeight={40}
                      visibleItems={3}
                      bgColor={isDark ? "#00000066" : "#F3F4F6"}
                    />
                    <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Minutes</Text>
                  </View>
                </View>
              </View>

            </ScrollView>

            {/* Floating Save Button */}
            <View 
              style={{ 
                position: "absolute", 
                bottom: keyboardHeight > 0 ? keyboardHeight + 20 : 40,
                left: 32, 
                right: 32 
              }}
            >
              <Pressable
                onPress={handleSave}
                disabled={!isFormValid}
                style={{ 
                  backgroundColor: !isFormValid ? (isDark ? "#2A2A2A" : "#F3F4F6") : accentColor,
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: !isFormValid ? 0 : 0.3,
                  shadowRadius: 20,
                  elevation: !isFormValid ? 0 : 10
                }}
                className="h-16 rounded-full items-center justify-center flex-row"
              >
                <Text 
                  style={{ color: !isFormValid ? "#9ca3af" : "white" }} 
                  className="text-lg font-black uppercase tracking-widest"
                >
                  {editingGoalId ? "Update Goal" : "Create Goal"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </View>

    </Modal>
  );
}
