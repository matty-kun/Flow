import WheelPicker from "@/components/forms/WheelPicker";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Props = {
  visible: boolean;
  hour: number;   // 0-23
  minute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
};

function to12h(hour24: number) {
  const isPm = hour24 >= 12;
  const h = hour24 % 12 || 12;
  return { h, isPm };
}

function to24h(h12: number, isPm: boolean) {
  if (isPm) return h12 === 12 ? 12 : h12 + 12;
  return h12 === 12 ? 0 : h12;
}

export default function TimePickerModal({ visible, hour, minute, onConfirm, onClose }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [localH12, setLocalH12] = useState(1);
  const [localMinute, setLocalMinute] = useState(0);
  const [isPm, setIsPm] = useState(false);

  useEffect(() => {
    if (visible) {
      const { h, isPm: pm } = to12h(hour);
      setLocalH12(h);
      setLocalMinute(minute);
      setIsPm(pm);
    }
  }, [visible, hour, minute]);

  const formatted = new Date(2000, 0, 1, to24h(localH12, isPm), localMinute)
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const hourValues = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minuteValues = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

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
          <Text style={{ fontSize: 18, fontWeight: "900", color: isDark ? "#fff" : "#121212", marginBottom: 4 }}>
            Time Started
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#FBBF24", marginBottom: 28, letterSpacing: -1 }}>
            {formatted}
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
            {/* Hour */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 9, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Hour
              </Text>
              <WheelPicker
                values={hourValues}
                selectedIndex={localH12 - 1}
                onChange={(i) => setLocalH12(i + 1)}
                itemHeight={40}
              />
            </View>

            {/* Minute */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 9, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Minute
              </Text>
              <WheelPicker
                values={minuteValues}
                selectedIndex={localMinute}
                onChange={setLocalMinute}
                itemHeight={40}
              />
            </View>

            {/* AM / PM */}
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 9, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Period
              </Text>
              <View style={{ gap: 8, marginTop: 8 }}>
                {(["AM", "PM"] as const).map((period) => {
                  const active = (period === "PM") === isPm;
                  return (
                    <Pressable
                      key={period}
                      onPress={() => setIsPm(period === "PM")}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: active ? "#FBBF24" : isDark ? "#27272a" : "#f3f4f6",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "900", color: active ? "#121212" : isDark ? "#9ca3af" : "#6b7280" }}>
                        {period}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => { onConfirm(to24h(localH12, isPm), localMinute); onClose(); }}
            style={{ backgroundColor: "#FBBF24", borderRadius: 18, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#121212", textTransform: "uppercase", letterSpacing: 1 }}>
              Set Time
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
