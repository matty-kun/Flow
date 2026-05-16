import { Activity } from "@/context/TrackingContext";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

interface Props {
  activities: Activity[];
  month: Date;
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const SLIDE_DISTANCE = 40;

function toYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildGrid(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDow = new Date(year, monthIndex, 1).getDay();

  const cells: Array<{ day: number | null; key: string }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, key: `pad-${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `d-${d}` });
  const remainder = cells.length % 7;
  if (remainder !== 0)
    for (let i = 0; i < 7 - remainder; i++) cells.push({ day: null, key: `end-${i}` });

  const rows: Array<typeof cells> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return { year, monthIndex, rows };
}

interface GridProps {
  month: Date;
  activities: Activity[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
  isDark: boolean;
  accentColor: string;
}

function HeatmapGrid({ month, activities, selectedDay, onSelectDay, isDark, accentColor }: GridProps) {
  const { year, monthIndex, rows } = useMemo(() => buildGrid(month), [month]);

  const minutesByDay = useMemo(() => {
    const map: Record<string, number> = {};
    const y = month.getFullYear();
    const m = month.getMonth();
    for (const a of activities) {
      const d = new Date(a.created_at);
      if (d.getFullYear() !== y || d.getMonth() !== m) continue;
      const key = toYMD(d);
      map[key] = (map[key] || 0) + (a.duration || 0);
    }
    return map;
  }, [activities, month]);

  const maxMinutes = useMemo(
    () => Math.max(1, ...Object.values(minutesByDay)),
    [minutesByDay]
  );

  const today = toYMD(new Date());
  const isCurrentMonth =
    new Date().getFullYear() === year && new Date().getMonth() === monthIndex;

  function intensityColor(minutes: number): string {
    if (minutes === 0) return isDark ? "#27272a" : "#f3f4f6";
    const ratio = Math.min(minutes / maxMinutes, 1);
    const opacity = 0.18 + ratio * 0.82;
    const baseColor = getContrastingColor(accentColor, isDark);
    return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  }

  return (
    <>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", marginBottom: 5 }}>
          {row.map((cell) => {
            if (!cell.day) {
              return <View key={cell.key} style={{ flex: 1, marginHorizontal: 2 }} />;
            }
            const ymd = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
            const mins = minutesByDay[ymd] || 0;
            const isSelected = selectedDay === ymd;
            const isToday = isCurrentMonth && ymd === today;
            const highlightColor = (accentColor === "#FFFFFF") ? (isDark ? "#FFFFFF" : "#121212") : getContrastingColor(accentColor, isDark);
            const todayBorderColor = (accentColor === "#FFFFFF") ? (isDark ? "rgba(255,255,255,0.5)" : "rgba(18,18,18,0.3)") : `${highlightColor}80`;

            return (
              <Pressable
                key={cell.key}
                onPress={() => onSelectDay(isSelected ? null : ymd)}
                style={{
                  flex: 1,
                  marginHorizontal: 2,
                  aspectRatio: 1,
                  borderRadius: 6,
                  backgroundColor: intensityColor(mins),
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                  borderColor: isSelected ? highlightColor : isToday ? todayBorderColor : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: isToday ? "900" : "600",
                    color:
                      mins > 0
                        ? ((accentColor === "#FFFFFF" && !isDark) ? "#121212" : (accentColor === "#18181b" && isDark ? "#18181b" : "#FFFFFF"))
                        : isDark
                        ? "#52525b"
                        : "#d1d5db",
                  }}
                >
                  {cell.day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </>
  );
}

export default function ActivityHeatmap({
  activities,
  month,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";

  // Track previous month to know slide direction
  const prevMonthRef = useRef(month);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Which rendered month is "current" vs "incoming"
  const [displayMonth, setDisplayMonth] = useState(month);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (month === prevMonthRef.current) return;

    const goingForward =
      month.getFullYear() > prevMonthRef.current.getFullYear() ||
      (month.getFullYear() === prevMonthRef.current.getFullYear() &&
        month.getMonth() > prevMonthRef.current.getMonth());

    prevMonthRef.current = month;

    if (isAnimating.current) {
      setDisplayMonth(month);
      return;
    }
    isAnimating.current = true;

    // Slide + fade out current, then snap to new month and slide in
    const outX = goingForward ? -SLIDE_DISTANCE : SLIDE_DISTANCE;
    const inX = goingForward ? SLIDE_DISTANCE : -SLIDE_DISTANCE;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: outX,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayMonth(month);
      slideAnim.setValue(inX);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 180,
          friction: 16,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimating.current = false;
      });
    });
  }, [month]);

  const monthLabel = displayMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={{ marginBottom: 28 }}>
      {/* Month navigation */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={onPrevMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? "#27272a" : "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronLeft size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
        </Pressable>

        <Animated.Text
          style={{
            fontSize: 15,
            fontWeight: "900",
            color: isDark ? "#fff" : "#121212",
            opacity: fadeAnim,
          }}
        >
          {monthLabel}
        </Animated.Text>

        <Pressable
          onPress={onNextMonth}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? "#27272a" : "#f3f4f6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
        </Pressable>
      </View>

      {/* Day-of-week labels */}
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "700",
                color: isDark ? "#52525b" : "#9ca3af",
                textTransform: "uppercase",
              }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Animated grid */}
      <Animated.View
        style={{
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        }}
      >
        <HeatmapGrid
          month={displayMonth}
          activities={activities}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
          isDark={isDark}
          accentColor={accentColor}
        />
      </Animated.View>

      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          marginTop: 8,
          gap: 4,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            color: isDark ? "#52525b" : "#9ca3af",
            fontWeight: "700",
            marginRight: 4,
          }}
        >
          Less
        </Text>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const opacity = 0.18 + ratio * 0.82;
          return (
            <View
              key={ratio}
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor:
                  ratio === 0
                    ? isDark
                      ? "#27272a"
                      : "#f3f4f6"
                    : `${getContrastingColor(accentColor, isDark)}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              }}
            />
          );
        })}
        <Text
          style={{
            fontSize: 9,
            color: isDark ? "#52525b" : "#9ca3af",
            fontWeight: "700",
            marginLeft: 4,
          }}
        >
          More
        </Text>
      </View>
    </View>
  );
}
