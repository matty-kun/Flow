import React from "react";
import { FlexWidget, TextWidget, ImageWidget } from "react-native-android-widget";

interface Props {
  todayMins: number;
  streak: number;
}

function formatFocusTime(totalMins: number): string {
  if (totalMins <= 0) return "0m";
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function FocusWidget({ todayMins, streak }: Props) {
  const focusText = formatFocusTime(todayMins);
  const hasStreak = streak > 0;
  const hasFocus = todayMins > 0;

  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#FBBF24",
        borderRadius: 24,
        padding: 16,
      }}
      clickAction="OPEN_APP"
    >
      {/* Header row: app name + plus button */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TextWidget
          text="flow"
          style={{
            fontSize: 12,
            fontWeight: "900",
            color: "rgba(18,18,18,0.5)",
            letterSpacing: 2,
          }}
        />
        <FlexWidget
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: "#121212",
            justifyContent: "center",
            alignItems: "center",
          }}
          clickAction="OPEN_URI"
          clickActionData={{ uri: "flow:///tracker" }}
        >
          <TextWidget
            text="+"
            style={{
              fontSize: 18,
              fontWeight: "900",
              color: "#FBBF24",
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Focus time */}
      <FlexWidget
        style={{
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <TextWidget
          text={hasFocus ? focusText : "Start focusing"}
          style={{
            fontSize: hasFocus ? 28 : 18,
            fontWeight: "900",
            color: "#121212",
          }}
        />
        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          {hasStreak ? (
            <TextWidget
              text={`🔥 ${streak} day streak`}
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "rgba(18,18,18,0.6)",
              }}
            />
          ) : (
            <TextWidget
              text="Today's focus"
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "rgba(18,18,18,0.5)",
              }}
            />
          )}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
