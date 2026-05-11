import React from "react";
import { FlexWidget, ImageWidget, TextWidget } from "react-native-android-widget";

interface Props {
  streak: number;
  weekDays: boolean[];
  todayMins: number;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakWidget({ streak, weekDays }: Props) {
  return (
    <FlexWidget
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#121212",
        borderRadius: 24,
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      {/* Top row: icon on the left */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          alignSelf: "stretch",
        }}
      >
        <FlexWidget
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: "#FBBF24",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ImageWidget
            image={require("../assets/images/splash-icon.png")}
            imageWidth={16}
            imageHeight={16}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Main row: fire+number | day dots */}
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          alignSelf: "stretch",
          flex: 1,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {/* Fire with streak number stacked on top */}
        <FlexWidget
          style={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            position: "relative",
            overflow: "visible",
          }}
        >
          <TextWidget text="🔥" style={{ fontSize: 44, position: "absolute" }} />
          <TextWidget
            text={`${streak}`}
            style={{
              fontSize: streak >= 100 ? 11 : streak >= 10 ? 14 : 17,
              fontWeight: "900",
              color: "#FFFFFF",
              position: "absolute",
              textAlign: "center",
            }}
          />
        </FlexWidget>

        {/* Day dots — evenly spaced */}
        <FlexWidget
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flex: 1,
            paddingLeft: 12,
            paddingRight: 4,
          }}
        >
          {DAY_LABELS.map((label, i) => (
            <FlexWidget
              key={i}
              style={{
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <FlexWidget
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: weekDays[i] ? "#FBBF24" : "rgba(255,255,255,0.12)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {weekDays[i] ? (
                  <TextWidget
                    text="✓"
                    style={{ fontSize: 10, fontWeight: "900", color: "#121212" }}
                  />
                ) : (
                  <TextWidget text="" style={{ fontSize: 10 }} />
                )}
              </FlexWidget>
              <TextWidget
                text={label}
                style={{
                  fontSize: 8,
                  fontWeight: "700",
                  color: weekDays[i] ? "#FBBF24" : "rgba(255,255,255,0.3)",
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
