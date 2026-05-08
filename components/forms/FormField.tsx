import React from "react";
import { Text, View } from "react-native";

type Props = {
  label: string;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
  /** className for the outer wrapper (e.g. "mb-5", "mb-8") */
  className?: string;
  /** className for the label row (e.g. "mb-2", "mb-4") — defaults to "mb-2" */
  labelClassName?: string;
  children: React.ReactNode;
};

export default function FormField({
  label,
  icon,
  headerRight,
  className,
  labelClassName = "mb-2",
  children,
}: Props) {
  return (
    <View className={className}>
      <View className={`flex-row items-center justify-between ${labelClassName}`}>
        <View className="flex-row items-center">
          {icon}
          <Text className={`text-xs font-bold text-gray-500 dark:text-gray-400 ${icon ? "ml-2" : ""}`}>
            {label}
          </Text>
        </View>
        {headerRight}
      </View>
      {children}
    </View>
  );
}
