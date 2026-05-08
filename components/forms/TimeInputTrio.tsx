import { useColorScheme } from "nativewind";
import React from "react";
import { Text, TextInput, View } from "react-native";

type Props = {
  hours: string;
  minutes: string;
  seconds: string;
  onChangeHours: (v: string) => void;
  onChangeMinutes: (v: string) => void;
  onChangeSeconds: (v: string) => void;
};

export default function TimeInputTrio({ hours, minutes, seconds, onChangeHours, onChangeMinutes, onChangeSeconds }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const placeholderColor = isDark ? "#3f3f46" : "#d1d5db";

  const fields = [
    { label: "Hrs", value: hours, onChange: onChangeHours },
    { label: "Min", value: minutes, onChange: onChangeMinutes },
    { label: "Sec", value: seconds, onChange: onChangeSeconds },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {fields.map(({ label, value, onChange }) => (
        <View key={label} style={{ flex: 1 }}>
          <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={placeholderColor}
            className="bg-gray-50 dark:bg-zinc-900 py-4 rounded-[20px] text-base font-black text-klowk-black dark:text-white text-center border border-gray-100 dark:border-zinc-800"
          />
          <Text className="text-center mt-2 text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
