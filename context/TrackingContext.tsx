import { CATEGORIES as DEFAULT_CATEGORIES } from "@/constants/Categories";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dismissInactivityReminderForToday } from "@/utils/notifications";
import { Platform } from "react-native";
import { WIDGET_DATA_KEY } from "@/widget/widgetTaskHandler";
import { useSQLiteContext } from "expo-sqlite";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

export type Category = {
  id: string;
  label: string;
  color: string;
  iconName: string;
  customImageUri?: string;
};

export interface CustomGoal {
  id: string;
  name: string;
  targetMins: number;
  categoryId: string;
  startDate: number;
  endDate: number;
  recurring?: "daily" | "weekly" | "monthly" | "none";
}

export type Activity = {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  start_time: number;
  end_time: number | null;
  duration: number | null;
  target_duration: number | null;
  created_at: number;
};

type TrackingContextType = {
  activities: Activity[];
  currentActivity: Activity | null;
  categories: Category[];
  startTracker: (
    title: string,
    category: string,
    description?: string,
    targetSecs?: number,
  ) => Promise<void>;
  stopTracker: (metadata?: { title?: string; category?: string; description?: string }) => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  clearAllActivities: () => Promise<void>;
  addManualActivity: (
    title: string,
    category: string,
    durationSecs: number,
    description?: string,
    customDate?: Date,
  ) => Promise<number | undefined>;
  editActivity: (
    id: number,
    title: string,
    category: string,
    durationSecs: number,
    description?: string,
    customDate?: Date,
  ) => Promise<void>;
  duplicateActivity: (id: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
  addCategory: (label: string, iconName: string, color: string, customImageUri?: string) => void;
  deleteCategory: (id: string) => void;
  editCategory: (id: string, label: string, iconName: string, color: string, customImageUri?: string) => void;
  getTotalFocusTimeToday: () => number;
  customGoals: CustomGoal[];
  isGoalsLoaded: boolean;
  addCustomGoal: (goal: CustomGoal) => void;
  deleteCustomGoal: (id: string) => void;
  editCustomGoal: (goal: CustomGoal) => void;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
};

const TrackingContext = createContext<TrackingContextType | null>(null);
const GOALS_STORAGE_KEY = "klowk_goals_v1";
const CATEGORIES_STORAGE_KEY = "klowk_categories_v1";

export function getRecurringWindow(recurring: "daily" | "weekly" | "monthly" | "none", nowTs = Date.now()): { startDate: number; endDate: number } | null {
  if (!recurring || recurring === "none") return null;
  const now = new Date(nowTs);
  if (recurring === "daily") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.getTime(), endDate: end.getTime() };
  }
  if (recurring === "weekly") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.getTime(), endDate: end.getTime() };
  }
  if (recurring === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start.getTime(), endDate: end.getTime() };
  }
  return null;
}

export function TrackingProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [customGoals, setCustomGoals] = useState<CustomGoal[]>([]);
  const [isGoalsLoaded, setIsGoalsLoaded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const isRefreshing = useRef(false);
  const currentActivityRef = useRef<Activity | null>(null);

  // Persistence for Categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const saved = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (saved) {
          const customCategories = JSON.parse(saved);
          setCategories([...DEFAULT_CATEGORIES, ...customCategories]);
        }
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const saveCategories = async () => {
      try {
        // Only save the custom categories (exclude defaults)
        const customCategories = categories.filter(
          (cat) =>
            !DEFAULT_CATEGORIES.some((defaultCat) => defaultCat.id === cat.id),
        );
        if (customCategories.length === 0) {
          await AsyncStorage.removeItem(CATEGORIES_STORAGE_KEY);
          return;
        }
        await AsyncStorage.setItem(
          CATEGORIES_STORAGE_KEY,
          JSON.stringify(customCategories),
        );
      } catch (e) {
        console.error("Failed to save categories", e);
      }
    };
    saveCategories();
  }, [categories]);

  // Persistence for Goals
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const saved = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
        if (saved) {
          const loadedGoals: CustomGoal[] = JSON.parse(saved);
          const nowTs = Date.now();
          const updatedGoals = loadedGoals.map((g) => {
            if (g.recurring && g.recurring !== "none" && nowTs > g.endDate) {
              const win = getRecurringWindow(g.recurring, nowTs);
              if (win) {
                return { ...g, startDate: win.startDate, endDate: win.endDate };
              }
            }
            return g;
          });
          setCustomGoals(updatedGoals);
        }
      } catch (e) {
        console.error("Failed to load goals", e);
      } finally {
        setIsGoalsLoaded(true);
      }
    };
    loadGoals();
  }, []);

  useEffect(() => {
    const saveGoals = async () => {
      try {
        if (customGoals.length === 0) {
          await AsyncStorage.removeItem(GOALS_STORAGE_KEY);
          return;
        }
        await AsyncStorage.setItem(
          GOALS_STORAGE_KEY,
          JSON.stringify(customGoals),
        );
      } catch (e) {
        console.error("Failed to save goals", e);
      }
    };
    saveGoals();
  }, [customGoals]);

  const addCustomGoal = (goal: CustomGoal) =>
    setCustomGoals((prev) => [...prev, goal]);
  const deleteCustomGoal = (id: string) =>
    setCustomGoals((prev) => prev.filter((g) => g.id !== id));
  const editCustomGoal = (goal: CustomGoal) =>
    setCustomGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));

  const addCategory = (label: string, iconName: string, color: string, customImageUri?: string) => {
    const newCat: Category = {
      id: label.toLowerCase().replace(/\s+/g, "-"),
      label,
      iconName,
      color,
      customImageUri,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const deleteCategory = (id: string) =>
    setCategories((prev) => prev.filter((c) => c.id !== id));

  const editCategory = (id: string, label: string, iconName: string, color: string, customImageUri?: string) =>
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, label, iconName, color, customImageUri } : c));

  const refreshActivities = async () => {
    if (!db || isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      const result = await db.getAllAsync<Activity>(
        "SELECT * FROM activities ORDER BY start_time DESC",
      );

      // Global State Check: Identify ongoing activity
      const ongoing = result.find((a) => a.end_time === null);
      currentActivityRef.current = ongoing || null;
      setCurrentActivity(ongoing || null);
      setActivities(result.filter((a) => a.end_time !== null));
    } catch (err) {
      console.warn(
        "DB Refresh issue (resource closed/hot-reload), retrying in next cycle",
      );
    } finally {
      isRefreshing.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      // Small delay to ensure DB provider is stable after hot-reload
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (isMounted) await refreshActivities();
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [db]); // Re-run if DB instance changes

  const startTracker = async (
    title: string,
    category: string,
    description?: string,
    targetSecs?: number,
    _retryCount = 0
  ) => {
    if (currentActivityRef.current) return;
    try {
      const now = Date.now();
      await db.runAsync(
        "INSERT INTO activities (title, category, description, start_time, target_duration, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [title, category, description || null, now, targetSecs || null, now],
      );
      await refreshActivities();
    } catch (err: any) {
      if (err.message?.includes("closed resource") && _retryCount < 3) {
        console.warn(`DB closed during hot-reload, retrying start (${_retryCount + 1}/3)...`);
        setTimeout(() => startTracker(title, category, description, targetSecs, _retryCount + 1), 1000);
      } else {
        console.error("Failed to start tracker:", err);
      }
    }
  };

  const stopTracker = async (metadata?: { title?: string; category?: string; description?: string }, _retryCount = 0) => {
    const activityToStop = currentActivityRef.current;
    if (!activityToStop) return;
    try {
      const now = Date.now();
      const durationSecs = Math.max(
        0,
        Math.floor((now - activityToStop.start_time) / 1000),
      );

      await db.runAsync(
        "UPDATE activities SET end_time = ?, duration = ?, title = ?, category = ?, description = ? WHERE id = ?",
        [
          now, 
          durationSecs, 
          metadata?.title || activityToStop.title, 
          metadata?.category || activityToStop.category, 
          metadata?.description || activityToStop.description, 
          activityToStop.id
        ],
      );
      setIsMinimized(false);
      await refreshActivities();
      dismissInactivityReminderForToday().catch(() => {});
    } catch (err: any) {
      if ((err.message?.includes("closed resource") || err.message?.includes("API misuse")) && _retryCount < 3) {
        console.warn(`DB issue during stop, retrying (${_retryCount + 1}/3)...`);
        setTimeout(() => stopTracker(_retryCount + 1), 1000);
      } else {
        console.error("Failed to stop tracker:", err);
      }
    }
  };

  const deleteActivity = async (id: number) => {
    try {
      await db.runAsync("DELETE FROM activities WHERE id = ?", [id]);
      await refreshActivities();
    } catch (err) {
      console.error("Failed to delete activity:", err);
    }
  };

  const clearAllActivities = async () => {
    try {
      await db.runAsync("DELETE FROM activities");
      await AsyncStorage.removeItem(GOALS_STORAGE_KEY);
      await AsyncStorage.removeItem(CATEGORIES_STORAGE_KEY);
      setCurrentActivity(null);
      setIsMinimized(false);
      setActivities([]);
      setCustomGoals([]);
      setCategories(DEFAULT_CATEGORIES);
    } catch (err) {
      console.error("Failed to clear activities:", err);
    }
  };

  const addManualActivity = async (
    title: string,
    category: string,
    durationSecs: number,
    description?: string,
    customDate?: Date,
  ) => {
    try {
      const timestamp = customDate ? customDate.getTime() : Date.now();
      const startTime = timestamp - durationSecs * 1000;
      const result = await db.runAsync(
        "INSERT INTO activities (title, category, description, start_time, end_time, duration, target_duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          title,
          category,
          description || null,
          startTime,
          timestamp,
          durationSecs,
          durationSecs,
          timestamp,
        ],
      );
      await refreshActivities();
      dismissInactivityReminderForToday().catch(() => {});
      return result.lastInsertRowId;
    } catch (err) {
      console.error("Failed to add manual activity:", err);
    }
  };

  const editActivity = async (
    id: number,
    title: string,
    category: string,
    durationSecs: number,
    description?: string,
    customDate?: Date,
  ) => {
    try {
      const timestamp = customDate ? customDate.getTime() : Date.now();
      const startTime = timestamp - durationSecs * 1000;
      await db.runAsync(
        "UPDATE activities SET title = ?, category = ?, description = ?, start_time = ?, end_time = ?, duration = ? WHERE id = ?",
        [
          title,
          category,
          description || null,
          startTime,
          timestamp,
          durationSecs,
          id,
        ],
      );
      await refreshActivities();
    } catch (err) {
      console.error("Failed to edit activity:", err);
    }
  };

  const duplicateActivity = async (id: number) => {
    try {
      const activityToCopy = activities.find((a) => a.id === id);
      if (!activityToCopy) return;

      const now = Date.now();
      await db.runAsync(
        "INSERT INTO activities (title, category, description, start_time, end_time, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          activityToCopy.title,
          activityToCopy.category,
          activityToCopy.description,
          now,
          now + (activityToCopy.duration || 0) * 60000,
          activityToCopy.duration,
          now,
        ],
      );
      await refreshActivities();
      dismissInactivityReminderForToday().catch(() => {});
    } catch (err) {
      console.error("Failed to duplicate activity:", err);
    }
  };

  // Sync widget data whenever activities change (Android only)
  /*
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sync = async () => {
      try {
        const React = await import("react");
        const { requestWidgetUpdate } = await import("react-native-android-widget");
        const { FocusWidget } = await import("@/widget/FocusWidget");
        const { StreakWidget } = await import("@/widget/StreakWidget");
        const startOfToday = new Date().setHours(0, 0, 0, 0);
        const todayMins = Math.floor(
          activities
            .filter((a) => a.start_time >= startOfToday && a.duration)
            .reduce((acc, a) => acc + (a.duration || 0), 0) / 60
        );
        const streak = computeStreak(activities);

        // Which days this week (Mon=0 … Sun=6) had at least one session
        const now = new Date();
        const mondayOffset = (now.getDay() + 6) % 7;
        const weekDays: boolean[] = Array(7).fill(false);
        for (let i = 0; i < 7; i++) {
          const d = new Date(now);
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - mondayOffset + i);
          const dayStart = d.getTime();
          const dayEnd = dayStart + 86400000;
          weekDays[i] = activities.some(
            (a) => a.start_time >= dayStart && a.start_time < dayEnd && !!a.duration
          );
        }

        const data = { todayMins, streak, weekDays };
        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));

        await requestWidgetUpdate({
          widgetName: "FocusWidget",
          renderWidget: () => React.default.createElement(FocusWidget, data),
          widgetNotFound: () => {},
        });
        await requestWidgetUpdate({
          widgetName: "StreakWidget",
          renderWidget: () => React.default.createElement(StreakWidget, data),
          widgetNotFound: () => {},
        });
      } catch {
        // widget not installed or not on Android — silently ignore
      }
    };
    sync();
  }, [activities]);
  */

  const getTotalFocusTimeToday = () => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    let totalSecs = activities
      .filter((a) => a.created_at >= startOfToday && a.duration)
      .reduce((acc, curr) => acc + (curr.duration || 0), 0);
    
    if (currentActivityRef.current && currentActivityRef.current.start_time >= startOfToday) {
      totalSecs += Math.floor((Date.now() - currentActivityRef.current.start_time) / 1000);
    }

    return Math.floor(totalSecs / 60);
  };

  return (
    <TrackingContext.Provider
      value={{
        activities,
        currentActivity,
        categories,
        startTracker,
        stopTracker,
        deleteActivity,
        clearAllActivities,
        addManualActivity,
        editActivity,
        duplicateActivity,
        refreshActivities,
        addCategory,
        deleteCategory,
        editCategory,
        getTotalFocusTimeToday,
        customGoals,
        isGoalsLoaded,
        addCustomGoal,
        deleteCustomGoal,
        editCustomGoal,
        isMinimized,
        setIsMinimized,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context)
    throw new Error("useTracking must be used within a TrackingProvider");
  return context;
}
