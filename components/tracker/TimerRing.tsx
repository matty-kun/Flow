import { CategoryIcon } from "@/components/category/CategoryIcon";
import { Category } from "@/context/TrackingContext";
import { Image } from "expo-image";
import Animated, { AnimatedProps } from "react-native-reanimated";
import { Dimensions, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, CircleProps } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get("window");
export const CIRCLE_SIZE = width * 0.8;
const radius = CIRCLE_SIZE / 2 - 10;
export const CIRCUMFERENCE = 2 * Math.PI * radius;

interface Props {
  isDark: boolean;
  displayTime: string;
  displayTitle: string;
  ringColor: string;
  isPomodoroMode: boolean;
  phaseDisplay: "work" | "break";
  roundDisplay: number;
  pTotalRounds: number;
  currentCategory: Category | undefined;
  animatedProps: AnimatedProps<CircleProps>;
}

export default function TimerRing({
  isDark,
  displayTime,
  displayTitle,
  ringColor,
  isPomodoroMode,
  phaseDisplay,
  roundDisplay,
  pTotalRounds,
  currentCategory,
  animatedProps,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.mascotContainer}>
        <Image
          source={require("../../assets/images/focus klowk.png")}
          style={styles.mascot}
          contentFit="contain"
        />
      </View>

      <View style={styles.circleContainer}>
        <Svg
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
        >
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
            strokeWidth="10"
            fill="transparent"
          />
          <AnimatedCircle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="90"
            scaleX={-1}
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>

        <View style={styles.timeOverlay}>
          <Text style={[styles.timerText, { color: isDark ? "#fff" : "#121212" }]}>
            {displayTime}
          </Text>

          {isPomodoroMode && (
            <View style={styles.pomodoroPhaseRow}>
              <Text style={[styles.pomodoroPhaseLabel, { color: ringColor }]}>
                {phaseDisplay === "work" ? "FOCUS" : "BREAK"}
              </Text>
              <View style={styles.roundDots}>
                {Array.from({ length: pTotalRounds }).map((_, i) => {
                  const done = i < roundDisplay - 1;
                  const current = i === roundDisplay - 1;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.roundDot,
                        {
                          backgroundColor:
                            done || current ? ringColor : isDark ? "#3f3f46" : "#e5e7eb",
                          width: current ? 18 : 8,
                          opacity: done ? 0.5 : 1,
                        },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          )}

          <Text style={[styles.titleText, { color: ringColor }]}>{displayTitle}</Text>

          {currentCategory && (
            <View style={[styles.categoryCapsule, { backgroundColor: `${currentCategory.color}20` }]}>
              <View style={[styles.categoryIconContainer, { backgroundColor: currentCategory.color }]}>
                <CategoryIcon name={currentCategory.iconName} size={12} color="#fff" />
              </View>
              <Text style={[styles.categoryText, { color: currentCategory.color }]}>
                {currentCategory.label}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  mascotContainer: {
    marginBottom: -40,
    zIndex: 10,
  },
  mascot: {
    width: 140,
    height: 140,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timeOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 54,
    fontWeight: "300",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  pomodoroPhaseRow: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 2,
  },
  pomodoroPhaseLabel: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  roundDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  roundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FBBF24",
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },
  categoryCapsule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 6,
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
});
