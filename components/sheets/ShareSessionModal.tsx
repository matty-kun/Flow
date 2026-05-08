import { Category } from "@/context/TrackingContext";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useColorScheme } from "nativewind";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { Camera, Download, ImagePlus, Share2, X } from "lucide-react-native";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import ShareSessionCard from "@/components/log/ShareSessionCard";

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  duration: string;
  category?: Category;
  dateLabel: string;
}

export default function ShareSessionModal({
  visible,
  onClose,
  title,
  duration,
  category,
  dateLabel,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 160, friction: 16, useNativeDriver: true }),
    ]).start();
  };

  const animateOut = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 80, duration: 180, useNativeDriver: true }),
    ]).start(cb);
  };

  const handleClose = () => {
    animateOut(onClose);
  };

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
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onShow={animateIn}
      onRequestClose={handleClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}
        onPress={handleClose}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isDark ? "#1c1c1e" : "#fff",
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              paddingTop: 16,
              paddingBottom: 40,
            }}
          >
            {/* Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "#3f3f46" : "#e5e7eb",
                alignSelf: "center",
                marginBottom: 20,
              }}
            />

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 24,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  color: isDark ? "#fff" : "#121212",
                }}
              >
                Share Session
              </Text>
              <Pressable
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? "#27272a" : "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
              </Pressable>
            </View>

            {/* Card preview — scrollable so tall photos don't overflow */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
            >
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <ViewShot
                  ref={viewShotRef}
                  options={{ format: "png", quality: 1.0 }}
                >
                  <ShareSessionCard
                    title={title}
                    duration={duration}
                    category={category}
                    dateLabel={dateLabel}
                    photoUri={photoUri}
                    forCapture={isCapturing}
                  />
                </ViewShot>
              </View>
            </ScrollView>

            {/* Controls — always pinned below the card */}
            <View style={{
              marginHorizontal: 24,
              marginBottom: 8,
              padding: 16,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
            }}>
              {/* Photo picker buttons */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                <Pressable
                  onPress={takePhoto}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 50,
                    backgroundColor: isDark ? "#27272a" : "#f3f4f6",
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
                    paddingVertical: 14,
                    borderRadius: 50,
                    backgroundColor: isDark ? "#27272a" : "#f3f4f6",
                    overflow: "hidden",
                  }}
                >
                  <ImagePlus size={18} color={isDark ? "#e5e7eb" : "#374151"} />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: isDark ? "#e5e7eb" : "#374151" }}>
                    Upload Photo
                  </Text>
                </Pressable>
              </View>

              {photoUri && (
                <Pressable
                  onPress={() => setPhotoUri(null)}
                  style={{ alignItems: "center", marginBottom: 12 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#ef4444" }}>
                    Remove photo
                  </Text>
                </Pressable>
              )}

              {/* Action buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={handleSave}
                  disabled={isSaving}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 50,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "#27272a" : "#f3f4f6",
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
                    borderRadius: 50,
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
          </Pressable>
        </Animated.View>
      </Pressable>

      {savedToast && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 100,
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
    </Modal>
  );
}
