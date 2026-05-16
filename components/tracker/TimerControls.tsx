import { Pause, Play, Square } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

interface Props {
  isDark: boolean;
  ringColor: string;
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  // Kept for compatibility during transition if needed
  isPomodoroMode?: boolean;
  isCompleted?: boolean;
  pomodoroWaiting?: boolean;
  midRoundWaiting?: boolean;
  onNextRound?: () => void;
  onFinish?: () => void;
}

export default function TimerControls({
  isDark,
  ringColor,
  isPaused,
  onTogglePause,
  onStop,
}: Props) {
  return (
    <View style={styles.controls}>
      <Pressable
        onPress={onStop}
        style={[styles.btn, { backgroundColor: ringColor }]}
      >
        <Square size={24} color="#121212" fill="#121212" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: "row",
    marginTop: 40,
    alignItems: "center",
  },
  btn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
});
