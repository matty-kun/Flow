import { Category } from "@/context/TrackingContext";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { Image as RNImage, Text, View } from "react-native";
import { CategoryIcon } from "@/components/category/CategoryIcon";

const CARD_WIDTH = 340;

interface Props {
  title: string;
  duration: string;
  category?: Category;
  dateLabel: string;
  photoUri?: string | null;
  cardRef?: React.RefObject<View>;
  forCapture?: boolean;
}

export default function ShareSessionCard({
  title,
  duration,
  category,
  dateLabel,
  photoUri,
  cardRef,
  forCapture = false,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const catColor = category?.color || "#FBBF24";

  const [photoHeight, setPhotoHeight] = useState(CARD_WIDTH);

  useEffect(() => {
    if (!photoUri) return;
    RNImage.getSize(photoUri, (w, h) => {
      setPhotoHeight(Math.round((h / w) * CARD_WIDTH));
    });
  }, [photoUri]);

  const content = (
    <View style={{ padding: 28 }}>
      {category && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: photoUri ? "rgba(0,0,0,0.4)" : `${catColor}30`,
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
            marginBottom: 16,
          }}
        >
          <CategoryIcon name={category.iconName} size={12} color={photoUri ? "#fff" : catColor} />
          <Text
            style={{
              marginLeft: 6,
              fontSize: 11,
              fontWeight: "800",
              color: photoUri ? "#fff" : catColor,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {category.label}
          </Text>
        </View>
      )}

      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: photoUri ? "#fff" : isDark ? "#fff" : "#121212",
          marginBottom: 4,
          lineHeight: 30,
        }}
        numberOfLines={2}
      >
        {title || "Session"}
      </Text>

      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: photoUri ? "rgba(255,255,255,0.7)" : isDark ? "#71717a" : "#9ca3af",
          marginBottom: 20,
        }}
      >
        {dateLabel}
      </Text>

      <Text
        style={{
          fontSize: 52,
          fontWeight: "900",
          color: photoUri ? "#fff" : isDark ? "#fff" : "#121212",
          letterSpacing: -2,
          lineHeight: 56,
        }}
      >
        {duration}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          marginTop: 16,
        }}
      >
        <RNImage
          source={require("@/assets/images/splash-icon.png")}
          style={{ width: 18, height: 18, borderRadius: 4, marginRight: 6 }}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "900",
            color: photoUri ? "rgba(255,255,255,0.6)" : isDark ? "#3f3f46" : "#d1d5db",
            letterSpacing: 0.5,
          }}
        >
          flow
        </Text>
      </View>
    </View>
  );

  return (
    <View
      ref={cardRef}
      style={{
        width: 340,
        borderRadius: 32,
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      {photoUri ? (
        <>
          <ExpoImage
            source={{ uri: photoUri }}
            style={{ width: CARD_WIDTH, height: photoHeight }}
            contentFit="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.72)"]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 200,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
            }}
          >
            {content}
          </View>
        </>
      ) : forCapture ? (
        <View style={{ height: 420, justifyContent: "flex-end" }}>
          {content}
        </View>
      ) : (
        <LinearGradient
          colors={
            isDark
              ? [`${catColor}22`, "#121212"]
              : [`${catColor}18`, "#ffffff"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ minHeight: 420, justifyContent: "flex-end" }}
        >
          <View
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: `${catColor}14`,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: `${catColor}20`,
            }}
          />
          {content}
        </LinearGradient>
      )}
    </View>
  );
}
