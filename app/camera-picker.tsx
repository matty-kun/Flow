import { impact } from "@/utils/haptics";
import { setPendingPhoto } from "@/utils/cameraBridge";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { X, Circle, Check } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraPickerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    impact(ImpactFeedbackStyle.Medium);
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo) setPreview(photo.uri);
    } finally {
      setIsCapturing(false);
    }
  };

  const confirm = () => {
    if (!preview) return;
    impact(ImpactFeedbackStyle.Light);
    setPendingPhoto(preview);
    router.back();
  };

  const retake = () => {
    impact(ImpactFeedbackStyle.Light);
    setPreview(null);
  };

  const cancel = () => {
    impact(ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center", paddingHorizontal: 32 }}>
          Camera access is required to take a photo.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={{ backgroundColor: "#FBBF24", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: "#121212", fontWeight: "700", fontSize: 15 }}>Grant Permission</Text>
        </Pressable>
        <Pressable onPress={cancel}>
          <Text style={{ color: "#9ca3af", fontSize: 14 }}>Cancel</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {preview ? (
        <>
          <Image source={{ uri: preview }} style={{ flex: 1, backgroundColor: "#000" }} resizeMode="contain" />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              paddingVertical: 32,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <Pressable
              onPress={retake}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={28} color="#fff" />
            </Pressable>
            <Pressable
              onPress={confirm}
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#FBBF24",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={28} color="#121212" />
            </Pressable>
          </SafeAreaView>
          {/* Top cancel */}
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <Pressable
              onPress={cancel}
              style={{
                margin: 16,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
        </>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            {...(Platform.OS === "android" ? { ratio: "16:9" } : {})}
          />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              alignItems: "center",
              paddingVertical: 32,
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          >
            <Pressable
              onPress={takePicture}
              disabled={isCapturing}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 4,
                borderColor: "rgba(255,255,255,0.4)",
              }}
            >
              {isCapturing ? (
                <ActivityIndicator color="#121212" />
              ) : (
                <Circle size={40} color="#121212" fill="#121212" />
              )}
            </Pressable>
          </SafeAreaView>
          {/* Top cancel */}
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <Pressable
              onPress={cancel}
              style={{
                margin: 16,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0,0,0,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}
