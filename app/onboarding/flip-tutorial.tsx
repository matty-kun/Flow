import { useOnboarding } from "@/context/OnboardingContext";
import { notification, impact } from "@/utils/haptics";
import { useAppTheme } from "@/context/ThemeContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState, useRef } from "react";
import {
  Pressable,
  Text,
  View,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Accelerometer } from "expo-sensors";
import { ChevronLeft, Zap } from "lucide-react-native";
import ProgressIndicator from "./ProgressIndicator";
import TypewriterText from "./TypewriterText";
import { Audio } from "expo-av";

const { width } = Dimensions.get("window");

export default function FlipTutorialScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const [isFlipped, setIsFlipped] = useState(false);
  const [focusModeOn, setFocusModeOn] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load chime sound
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../../assets/sounds/chime.mp3")
        );
        soundRef.current = sound;
      } catch (e) {
        console.log("No chime sound found, skipping audio feedback.");
      }
    };
    loadSound();
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (!focusModeOn) return;

    let subscription: any;
    const subscribe = async () => {
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(({ z }) => {
        // z < -0.8 means screen is facing down
        if (z < -0.85) {
          if (!isFlipped) {
            handleFlipDetected();
          }
        }
      });
    };

    subscribe();
    return () => subscription?.remove();
  }, [focusModeOn, isFlipped]);

  const handleFlipDetected = async () => {
    setIsFlipped(true);
    notification(NotificationFeedbackType.Success);
    impact(ImpactFeedbackStyle.Heavy);
    
    try {
      await soundRef.current?.replayAsync();
    } catch (e) {}

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    router.push("/onboarding/notifications");
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top", "bottom"]}
    >
      <ProgressIndicator currentStep={3} totalSteps={4} />

      <View className="flex-1 px-8 py-8 items-center justify-center">
        <Pressable
          onPress={() => router.back()}
          className="absolute top-4 left-6 z-10 p-2"
        >
          <ChevronLeft size={24} color={isDark ? "#ffffff" : "#000000"} />
        </Pressable>

        {!isFlipped ? (
          <>
            {/* Mascot */}
            <View className="mb-8 items-center">
              <Image
                source={require("../../assets/images/phone flow.png")}
                style={{ width: 240, height: 240 }}
                contentFit="contain"
              />
            </View>

            {/* Instruction Bubble */}
            <View className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm w-full mb-8">
              <TypewriterText
                text={!focusModeOn 
                  ? "Now, for the magic. First, turn on Focus Mode calibration below."
                  : "Perfect. Now, lay your phone face-down on the table right now."}
                className="text-base font-bold text-klowk-black dark:text-white leading-5 text-center"
              />
            </View>

            {!focusModeOn ? (
              <Pressable
                onPress={() => {
                  impact(ImpactFeedbackStyle.Medium);
                  setFocusModeOn(true);
                }}
                style={{ backgroundColor: accentColor }}
                className="w-full py-12 rounded-full flex-row items-center justify-center"
              >
                <Zap size={20} color="white" />
                <Text className="ml-2 text-lg font-black text-white uppercase tracking-[2px]">
                  TURN ON FOCUS MODE
                </Text>
              </Pressable>
            ) : (
              <View className="items-center">
                <Animated.View style={{ opacity: 1 }} className="mb-4">
                  <Image 
                    source={require("../../assets/images/flip phone.png")}
                    style={{ width: 140, height: 140 }}
                    contentFit="contain"
                  />
                </Animated.View>
                <Text className="text-gray-400 dark:text-zinc-500 font-bold animate-pulse">
                  Waiting for flip...
                </Text>
              </View>
            )}
          </>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <View className="mb-8 items-center">
              <Image
                source={require("../../assets/images/icon.png")}
                style={{ width: 180, height: 180 }}
                contentFit="contain"
              />
            </View>
            
            <View className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-gray-100 dark:border-zinc-800 shadow-sm w-full mb-10">
              <Text className="text-lg font-black text-klowk-black dark:text-white text-center mb-2">
                Magic. ✨
              </Text>
              <Text className="text-base font-bold text-zinc-500 dark:text-zinc-400 text-center leading-5">
                "That’s how you start a session. No buttons, just focus."
              </Text>
            </View>

            <Pressable
              onPress={handleNext}
              style={{ backgroundColor: accentColor }}
              className="w-full py-12 rounded-full items-center justify-center"
            >
              <Text className="text-lg font-black text-white uppercase tracking-[2px]">
                CONTINUE →
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
