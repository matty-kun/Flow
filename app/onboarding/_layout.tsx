import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="handshake" />
      <Stack.Screen name="projects" />
      <Stack.Screen name="flip-tutorial" />
      <Stack.Screen name="notifications" />
      {/* Legacy screens kept for reference but not in main flow */}
      <Stack.Screen name="goal" />
      <Stack.Screen name="test-log" />
    </Stack>
  );
}
