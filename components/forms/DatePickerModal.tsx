import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  selected: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

export default function DatePickerModal({ visible, selected, onSelect, onClose }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [viewedMonth, setViewedMonth] = useState(new Date(selected));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const changeMonth = (offset: number) => {
    setViewedMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + offset);
      return d;
    });
  };

  const days = getDaysInMonth(viewedMonth);
  const monthName = viewedMonth.toLocaleString("default", { month: "long" });
  const yearName = viewedMonth.getFullYear();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 }}
        onPress={onClose}
      >
        <Pressable
          style={{ width: "100%", backgroundColor: isDark ? "#1C1C1E" : "#fff", padding: 24, borderRadius: 32 }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Month Navigation */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
            <Pressable
              onPress={() => changeMonth(-1)}
              style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6", borderRadius: 12 }}
            >
              <ChevronLeft size={18} color="#FBBF24" />
            </Pressable>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontWeight: "900", fontSize: 18, color: isDark ? "#fff" : "#121212" }}>
                {monthName}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "700", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2 }}>
                {yearName}
              </Text>
            </View>
            <Pressable
              onPress={() => changeMonth(1)}
              style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6", borderRadius: 12 }}
            >
              <ChevronRight size={18} color="#FBBF24" />
            </Pressable>
          </View>

          {/* Day Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Text
                key={i}
                style={{ width: "14.2%", textAlign: "center", fontSize: 9, fontWeight: "900", color: isDark ? "#71717a" : "#d1d5db", marginBottom: 16 }}
              >
                {d}
              </Text>
            ))}
            {days.map((d, i) => {
              const isSelected = d?.toDateString() === selected.toDateString();
              const isToday = d?.toDateString() === new Date().toDateString();
              return (
                <Pressable
                  key={i}
                  onPress={() => { if (d) { onSelect(d); onClose(); } }}
                  style={{ width: "14.2%", aspectRatio: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4, backgroundColor: isSelected ? "#FBBF24" : "transparent" }}
                >
                  <Text style={{ fontWeight: "900", color: isSelected ? "#fff" : isToday ? "#FBBF24" : isDark ? "#a1a1aa" : "#121212" }}>
                    {d ? d.getDate() : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
