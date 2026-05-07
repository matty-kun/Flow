import { Check, Pause, Play, Share2, Square } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  isDark: boolean;
  ringColor: string;
  isPomodoroMode: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  pomodoroWaiting: boolean;
  midRoundWaiting: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  onNextRound: () => void;
  onFinish: () => void;
  onShare?: () => void;
}

export default function TimerControls({
  isDark,
  ringColor,
  isPomodoroMode,
  isPaused,
  isCompleted,
  pomodoroWaiting,
  midRoundWaiting,
  onTogglePause,
  onStop,
  onNextRound,
  onFinish,
  onShare,
}: Props) {
  if (isPomodoroMode && midRoundWaiting) {
    return (
      <View style={styles.controls}>
        <Pressable onPress={onNextRound} style={[styles.btn, styles.checkBtn, { backgroundColor: ringColor }]}>
          <Play size={28} color="#121212" fill="#121212" />
        </Pressable>
      </View>
    );
  }

  if (isCompleted && !isPomodoroMode) {
    return (
      <View style={styles.controls}>
        {onShare && (
          <Pressable
            onPress={onShare}
            style={[styles.btn, { backgroundColor: isDark ? "#27272a" : "#f3f4f6", marginRight: 16 }]}
          >
            <Share2 size={22} color={isDark ? "#e5e7eb" : "#374151"} />
          </Pressable>
        )}
        <Pressable onPress={onFinish} style={[styles.btn, styles.checkBtn, { backgroundColor: "#FBBF24" }]}>
          <Check size={30} color="#121212" strokeWidth={3} />
        </Pressable>
      </View>
    );
  }

  if (isPomodoroMode && pomodoroWaiting) {
    return (
      <View style={styles.controls}>
        <Pressable onPress={onFinish} style={[styles.btn, styles.checkBtn, { backgroundColor: ringColor }]}>
          <Check size={30} color="#121212" strokeWidth={3} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.controls}>
      <Pressable onPress={onTogglePause} style={[styles.btn, { backgroundColor: ringColor }]}>
        {isPaused
          ? <Play size={24} color="#121212" fill="#121212" />
          : <Pause size={24} color="#121212" fill="#121212" />
        }
      </Pressable>
      <Pressable
        onPress={onStop}
        style={[styles.btn, { backgroundColor: isDark ? "#fff" : "#121212", marginLeft: 20 }]}
      >
        <Square size={20} color={isDark ? "#121212" : "#fff"} fill={isDark ? "#121212" : "#fff"} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    marginTop: 60,
    alignItems: "center",
  },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  checkBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});
