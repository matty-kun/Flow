import { Text, View } from "@/components/ui/Themed";
import {
    Bell,
    Check,
    ChevronRight,
    CircleHelp,
    LogOut,
    Pencil,
    Shield,
    User,
} from "lucide-react-native";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Switch, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOnboarding } from "@/context/OnboardingContext";

export default function SettingsScreen() {
  const { userName, setUserName } = useOnboarding();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName || "");
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotificationsEnabled(status === "granted");
    });
  }, []);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed) await setUserName(trimmed);
    setEditingName(false);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === "granted");
    } else {
      setNotificationsEnabled(false);
    }
  };

  const sections = [
    { icon: User, label: "Profile" },
    { icon: Shield, label: "Privacy & Security" },
    { icon: CircleHelp, label: "Help & Support" },
    { icon: LogOut, label: "Sign Out", color: "#ef4444" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-4xl font-extrabold text-klowk-black mb-8">
          Settings
        </Text>

        {/* Premium Profile Card */}
        <View className="bg-white rounded-[32px] p-6 mb-8 flex-row items-center border border-gray-100 shadow-sm relative overflow-hidden">
          <View className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full -mr-8 -mt-8" />
          <View className="w-16 h-16 bg-klowk-black rounded-2xl items-center justify-center mr-4 shadow-md">
            <User size={30} color="#FBBF24" />
          </View>
          <View className="flex-1">
            {editingName ? (
              <TextInput
                ref={nameInputRef}
                value={nameInput}
                onChangeText={setNameInput}
                onSubmitEditing={handleSaveName}
                autoFocus
                returnKeyType="done"
                className="text-xl font-black text-klowk-black pr-2"
                style={{ padding: 0 }}
              />
            ) : (
              <Text className="text-xl font-black text-klowk-black pr-2">
                {userName || "User"}
              </Text>
            )}
            <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Flow Pro Account
            </Text>
          </View>
          <Pressable
            onPress={editingName ? handleSaveName : () => { setNameInput(userName || ""); setEditingName(true); }}
            className="bg-amber-400/10 p-2 rounded-full"
          >
            {editingName
              ? <Check size={16} color="#FBBF24" strokeWidth={3} />
              : <Pencil size={16} color="#FBBF24" strokeWidth={2} />
            }
          </Pressable>
        </View>

        {/* Notifications Row */}
        <View className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden mb-4">
          <View className="flex-row items-center justify-between p-5">
            <View className="flex-row items-center">
              <View className="w-10 h-10 items-center justify-center mr-4 rounded-xl bg-gray-50">
                <Bell size={20} color="#121212" />
              </View>
              <Text className="text-base font-bold text-klowk-black">
                Notifications
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: "#e5e7eb", true: "#FBBF24" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Settings List */}
        <View className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
          {sections.map((item, i) => (
            <Pressable
              key={i}
              className={`flex-row items-center justify-between p-5 active:opacity-60 ${i !== sections.length - 1 ? "border-b border-gray-50" : ""}`}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-10 h-10 items-center justify-center mr-4 rounded-xl ${item.color ? "bg-red-50" : "bg-gray-50"}`}
                >
                  <item.icon size={20} color={item.color || "#121212"} />
                </View>
                <Text
                  className={`text-base font-bold ${item.color ? "text-red-500" : "text-klowk-black"}`}
                >
                  {item.label}
                </Text>
              </View>
              <ChevronRight size={18} color={item.color || "#e5e7eb"} />
            </Pressable>
          ))}
        </View>

        {/* Bottom Spacer */}
        <View className="h-32 bg-transparent" />
      </ScrollView>
    </SafeAreaView>
  );
}
