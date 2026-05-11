import { useTracking } from "@/context/TrackingContext";
import { impact, notification } from "@/utils/haptics";
import {
  getShakeUndoEnabled,
  subscribeShakeUndoPreference,
} from "@/utils/shakeUndoPrefs";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { Accelerometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

const SHAKE_SPEED_THRESHOLD = 520;
const SHAKE_DEBOUNCE_MS = 2200;

/**
 * When enabled in Settings, detects a device shake and deletes the most recent completed focus log.
 */
export default function ShakeUndoListener() {
  const { activities, deleteActivity, currentActivity } = useTracking();
  const activitiesRef = useRef(activities);
  activitiesRef.current = activities;
  const currentRef = useRef(currentActivity);
  currentRef.current = currentActivity;
  const deleteRef = useRef(deleteActivity);
  deleteRef.current = deleteActivity;

  const [enabled, setEnabled] = useState(getShakeUndoEnabled);
  useEffect(
    () => subscribeShakeUndoPreference(() => setEnabled(getShakeUndoEnabled())),
    [],
  );

  const lastShakeAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    void (async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (cancelled || !available) return;
        Accelerometer.setUpdateInterval(100);

        let last = { x: 0, y: 0, z: 0 };
        let lastT = Date.now();
        let initialized = false;

        subscription = Accelerometer.addListener((a) => {
          const now = Date.now();
          if (!initialized) {
            last = { x: a.x, y: a.y, z: a.z };
            lastT = now;
            initialized = true;
            return;
          }
          const dt = Math.max(16, now - lastT);
          // Calculate the magnitude of the change vector (Euclidean distance)
          const dx = a.x - last.x;
          const dy = a.y - last.y;
          const dz = a.z - last.z;
          const speed = (Math.sqrt(dx * dx + dy * dy + dz * dz) / dt) * 10000;

          last = { x: a.x, y: a.y, z: a.z };
          lastT = now;

          if (speed < SHAKE_SPEED_THRESHOLD) return;
          if (now - lastShakeAt.current < SHAKE_DEBOUNCE_MS) return;
          lastShakeAt.current = now;

          if (cancelled) return;

          const cur = currentRef.current;
          const list = activitiesRef.current;
          const completed = [...list]
            .filter(
              (row) =>
                row.duration != null &&
                row.duration > 0 &&
                (!cur || row.id !== cur.id),
            )
            .sort((x, y) => y.id - x.id);
          const victim = completed[0];
          if (!victim) return;

          void deleteRef.current(victim.id).then(() => {
            impact(ImpactFeedbackStyle.Medium);
            notification(NotificationFeedbackType.Success);
          });
        });
      } catch {
        /* sensor unavailable */
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);

  return null;
}
