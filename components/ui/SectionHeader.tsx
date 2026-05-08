import React from "react";
import { Text } from "react-native";

type Props = {
  label: string;
  className?: string;
};

export default function SectionHeader({ label, className = "mb-3 ml-1" }: Props) {
  return (
    <Text
      className={`text-[10px] font-black tracking-widest uppercase text-gray-400 dark:text-zinc-500 ${className}`}
    >
      {label}
    </Text>
  );
}
