import React from "react";
import { FlexWidget, ImageWidget, TextWidget, OverlapWidget } from "react-native-android-widget";

interface Props {
  streak: number;
  weekDays: boolean[];
  todayMins: number;
  accentColor: string;
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakWidget({ streak, weekDays, accentColor }: Props) {
  const activeColor = (accentColor === "#18181b" ? "#FFFFFF" : accentColor) as any;

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
          justifyContent: "space-between",
          alignItems: "center",
          width: "match_parent",
        }}
      >
        <FlexWidget
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            backgroundColor: activeColor as any,
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

        <ImageWidget
          image={require("../assets/images/adaptive-icon-foreground.png")}
          imageWidth={22}
          imageHeight={22}
        />
      </FlexWidget>

      {/* Main row: fire+number | day dots */}
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "match_parent",
          flex: 1,
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {/* Fire with streak number stacked on top */}
        <OverlapWidget
          style={{
            width: 56,
            height: 56,
          }}
        >
          <TextWidget 
            text="🔥" 
            style={{ 
              fontSize: 44, 
              width: "match_parent", 
              height: "match_parent", 
              textAlign: "center" 
            }} 
          />
          <FlexWidget 
            style={{ 
              width: "match_parent", 
              height: "match_parent", 
              justifyContent: "center", 
              alignItems: "center" 
            }}
          >
            <TextWidget
              text={`${streak}`}
              style={{
                fontSize: streak >= 100 ? 11 : streak >= 10 ? 14 : 17,
                fontWeight: "900",
                color: "#FFFFFF",
                textAlign: "center",
              }}
            />
          </FlexWidget>
        </OverlapWidget>

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
              }}
            >
              <FlexWidget
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: (weekDays[i] ? activeColor : "#ffffff1F") as any,
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
                  color: (weekDays[i] ? activeColor : "#ffffff4D") as any,
                  marginTop: 4,
                }}
              />
            </FlexWidget>
          ))}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
