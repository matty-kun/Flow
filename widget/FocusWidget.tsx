import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface Props {
  todayMins: number;
  streak: number;
  weekDays: boolean[];
  accentColor: string;
}

export function FocusWidget({ todayMins, streak, weekDays, accentColor }: Props) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: (accentColor === "#18181b" ? "#FFFFFF" : accentColor) as any,
        borderRadius: 24,
        padding: 16,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: "flow:///tracker" }}
    >
      <TextWidget
        text="Start Flow"
        style={{
          fontSize: 20,
          fontWeight: "900",
          color: accentColor === "#18181b" ? "#121212" : "#FFFFFF",
          textAlign: "center",
        }}
      />
    </FlexWidget>
  );
}
