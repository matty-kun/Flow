import ShareSessionCard from "@/components/log/ShareSessionCard";
import { Category } from "@/context/TrackingContext";
import { impact } from "@/utils/haptics";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { ImpactFeedbackStyle } from "expo-haptics";
import { ArrowLeft, Camera, Download, ImagePlus, Share2, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

export default function ShareSessionScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const params = useLocalSearchParams<{
    title: string;
    duration: string;
    dateLabel: string;
    category?: string;
  }>();

  const category: Category | undefined = params.category
    ? JSON.parse(params.category)
    : undefined;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);

  const showSavedToast = () => {
    setSavedToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setSavedToast(false));
  };

  const captureCard = (): Promise<string> =>
    new Promise((resolve) => {
      setIsCapturing(true);
      requestAnimationFrame(async () => {
        const uri = await (viewShotRef.current as any).capture();
        setIsCapturing(false);
        resolve(uri);
      });
    });

  const pickFromLibrary = async () => {
    impact(ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const takePhoto = async () => {
    impact(ImpactFeedbackStyle.Light);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!viewShotRef.current) return;
    impact(ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;
      const uri = await captureCard();
      const asset = await MediaLibrary.createAssetAsync(uri);
      const albums = await MediaLibrary.getAlbumsAsync();
      const flowAlbum = albums.find((a) => a.title === "Flow");
      if (flowAlbum) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], flowAlbum, false);
      } else {
        await MediaLibrary.createAlbumAsync("Flow", asset, false);
      }
      showSavedToast();
    } catch (e) {
      console.warn("Save failed", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!viewShotRef.current) return;
    impact(ImpactFeedbackStyle.Medium);
    setIsSharing(true);
    try {
      const uri = await captureCard();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch (e) {
      console.warn("Share failed", e);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#0a0a0a" : "#f5f5f5" }}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDark ? "#27272a" : "#e5e7eb",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <ArrowLeft size={18} color={isDark ? "#e5e7eb" : "#374151"} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>
          Share Session
        </Text>
      </View>

      {/* Scrollable card preview */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 16, paddingBottom: 220 }}
      >
        <View>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }}>
            <ShareSessionCard
              title={params.title}
              duration={params.duration}
              category={category}
              dateLabel={params.dateLabel}
              photoUri={photoUri}
              forCapture={isCapturing}
            />
          </ViewShot>

          {/* Remove photo badge — top-right of card */}
          {photoUri && (
            <Pressable
              onPress={() => setPhotoUri(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(0,0,0,0.55)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} color="#fff" />
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Glassmorphism floating controls */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32,
          backgroundColor: isDark ? "rgba(15,15,15,0.72)" : "rgba(255,255,255,0.72)",
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
        }}
      >
        {/* Photo picker */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <Pressable
            onPress={takePhoto}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 13,
              borderRadius: 16,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <Camera size={18} color={isDark ? "#e5e7eb" : "#374151"} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: isDark ? "#e5e7eb" : "#374151" }}>
              Camera
            </Text>
          </Pressable>

          <Pressable
            onPress={pickFromLibrary}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 13,
              borderRadius: 16,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}
          >
            <ImagePlus size={18} color={isDark ? "#e5e7eb" : "#374151"} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: isDark ? "#e5e7eb" : "#374151" }}>
              Upload Photo
            </Text>
          </Pressable>
        </View>

        {/* Action buttons */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              opacity: isSaving ? 0.6 : 1,
              overflow: "hidden",
            }}
          >
            {isSaving ? (
              <ActivityIndicator color={isDark ? "#e5e7eb" : "#374151"} />
            ) : (
              <Download size={22} color={isDark ? "#e5e7eb" : "#374151"} />
            )}
          </Pressable>

          <Pressable
            onPress={handleShare}
            disabled={isSharing}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#FBBF24",
              opacity: isSharing ? 0.7 : 1,
              overflow: "hidden",
            }}
          >
            {isSharing ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <>
                <Share2 size={20} color="#121212" />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "900",
                    color: "#121212",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Share
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {savedToast && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 200,
            alignSelf: "center",
            opacity: toastAnim,
            backgroundColor: "#121212",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 24,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
            Image saved
          </Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
