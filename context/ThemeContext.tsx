import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "nativewind";

export type PresetColor = {
  id: string;
  name: string;
  value: string;
};

export const PRESET_COLORS: PresetColor[] = [
  { id: "amber", name: "Amber", value: "#FBBF24" }, // Default Flow yellow
  { id: "teal", name: "Teal", value: "#14b8a6" },
  { id: "rose", name: "Rose", value: "#f43f5e" },
  { id: "pink", name: "Pink", value: "#f472b6" },
  { id: "indigo", name: "Indigo", value: "#6366f1" },
  { id: "emerald", name: "Emerald", value: "#10b981" },
  { id: "violet", name: "Violet", value: "#8b5cf6" },
  { id: "sky", name: "Sky", value: "#0ea5e9" },
  { id: "orange", name: "Orange", value: "#f97316" },
  { id: "brown", name: "Brown", value: "#78350f" },
  { id: "cyan", name: "Cyan", value: "#06b6d4" },
  { id: "lime", name: "Lime", value: "#84cc16" },
  { id: "fuchsia", name: "Fuchsia", value: "#d946ef" },
  { id: "crimson", name: "Crimson", value: "#be123c" },
  { id: "white", name: "White", value: "#FFFFFF" }, // Uses gradient in UI
  { id: "black", name: "Black", value: "#18181b" },
];

export const getFilteredColors = (isDark: boolean) => {
  return PRESET_COLORS.filter(color => {
    if (isDark && color.id === "black") return false;
    if (!isDark && color.id === "white") return false;
    return true;
  });
};

type ThemeContextType = {
  accentColor: string;
  setAccentColor: (hex: string) => Promise<void>;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  accentColor: PRESET_COLORS[0].value,
  setAccentColor: async () => {},
  isLoading: true,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<string>(PRESET_COLORS[0].value);
  const [isLoading, setIsLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    loadColor();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isDark && accentColor.toUpperCase() === "#FFFFFF") {
        setAccentColor("#18181b");
      } else if (isDark && accentColor.toLowerCase() === "#18181b") {
        setAccentColor("#FFFFFF");
      }
    }
  }, [isDark, isLoading, accentColor]);

  const loadColor = async () => {
    try {
      const saved = await AsyncStorage.getItem("flow_accent_color");
      if (saved) {
        if (!isDark && saved.toUpperCase() === "#FFFFFF") {
          setAccentColorState("#18181b");
        } else if (isDark && saved.toLowerCase() === "#18181b") {
          setAccentColorState("#FFFFFF");
        } else {
          setAccentColorState(saved);
        }
      }
    } catch (e) {
      console.error("Failed to load accent color:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const setAccentColor = async (hex: string) => {
    setAccentColorState(hex);
    try {
      await AsyncStorage.setItem("flow_accent_color", hex);
    } catch (e) {
      console.error("Failed to save accent color:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);

/**
 * Returns White if the accentColor is Black and the current mode is Dark.
 * Otherwise returns the accentColor.
 */
export const getContrastingColor = (accentColor: string, isDark: boolean) => {
  // If theme is Black (#18181b) and we are in dark mode, use White for foreground elements
  if (accentColor === "#18181b" && isDark) return "#FFFFFF";
  return accentColor;
};
