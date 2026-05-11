import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

interface Props {
  todayMins: number;
  streak: number;
  weekDays: boolean[];
}

export function FocusWidget(_props: Props) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FBBF24",
        borderRadius: 24,
        padding: 16,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri: "flow:///live" }}
    >
      <TextWidget
        text="Start Flow State"
        style={{
          fontSize: 20,
          fontWeight: "900",
          color: "#121212",
          textAlign: "center",
        }}
      />
    </FlexWidget>
  );
}
