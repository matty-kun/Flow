import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { Accelerometer } from "expo-sensors";
import { useTracking } from "./TrackingContext";
import { notification, impact } from "@/utils/haptics";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { useRouter } from "expo-router";

type FocusModeContextType = {
  isSensorEnabled: boolean;
  setIsSensorEnabled: (val: boolean) => void;
  isFaceUp: boolean;
};

const FocusModeContext = createContext<FocusModeContextType | null>(null);

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [isSensorEnabled, setIsSensorEnabled] = useState(false);
  const [isFaceUp, setIsFaceUp] = useState(true);
  const { currentActivity, startTracker, stopTracker } = useTracking();
  const router = useRouter();
  
  const activityRef = useRef(currentActivity);
  const isFaceUpRef = useRef(true);
  const isStartingRef = useRef(false);

  useEffect(() => { activityRef.current = currentActivity; }, [currentActivity]);

  useEffect(() => {
    if (!isSensorEnabled) {
      isFaceUpRef.current = true;
      isStartingRef.current = false;
      if (activityRef.current) {
        stopTracker().catch(() => {});
      }
      return;
    }

    let subscription: any;
    const startListening = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) return;

      Accelerometer.setUpdateInterval(400);
      subscription = Accelerometer.addListener(({ z }) => {
        // --- FACE DOWN ---
        if (z < -0.75 && isFaceUpRef.current) {
          isFaceUpRef.current = false;
          setIsFaceUp(false);
          if (!isStartingRef.current) {
            handleRitualStart();
          }
        } 
        // --- FACE UP ---
        else if (z > 0.6 && !isFaceUpRef.current) {
          isFaceUpRef.current = true;
          setIsFaceUp(true);
        }
      });
    };

    const handleRitualStart = async () => {
      isStartingRef.current = true;
      
      // STRONG START VIBRATION
      impact(ImpactFeedbackStyle.Heavy);
      
      try {
        router.push("/tracker");
        await startTracker("Focus Session", "");
      } catch (e) {
      } finally {
        isStartingRef.current = false;
      }
    };

    startListening();
    return () => subscription?.remove();
  }, [isSensorEnabled]);

  const handleSetIsSensorEnabled = (val: boolean) => {
    setIsSensorEnabled(val);
    if (val) {
      notification(NotificationFeedbackType.Success);
      impact(ImpactFeedbackStyle.Heavy);
    } else {
      impact(ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <FocusModeContext.Provider value={{ isSensorEnabled, setIsSensorEnabled: handleSetIsSensorEnabled, isFaceUp }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) throw new Error("useFocusMode must be used within a FocusModeProvider");
  return context;
};
