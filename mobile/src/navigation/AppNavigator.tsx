import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import { LoadingSpinner } from "../components/LoadingSpinner";
import { LoginScreen } from "../features/auth/LoginScreen";
import { SignupScreen } from "../features/auth/SignupScreen";
import { useAuth } from "../features/auth/useAuth";
import { BattleScreen } from "../features/battle/BattleScreen";
import { BattleSetupScreen } from "../features/battle/BattleSetup";
import { CameraScreen } from "../features/camera/CameraScreen";
import { PreviewScreen } from "../features/camera/PreviewScreen";
import { BagScreen } from "../features/collection/BagScreen";
import type { MainTabParamList, RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#2D6A4F",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#EEE" },
        headerStyle: { backgroundColor: "#2D6A4F" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Tab.Screen
        name="Bag"
        component={BagScreen}
        options={{
          title: "My Creatures",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎒</Text>,
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: "Capture",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📸</Text>,
        }}
      />
      <Tab.Screen
        name="Battles"
        component={BattleSetupScreen}
        options={{
          title: "Battles",
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚔️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Preview"
            component={PreviewScreen}
            options={{
              headerShown: true,
              title: "Preview",
              headerStyle: { backgroundColor: "#1A1A1A" },
              headerTintColor: "#fff",
            }}
          />
          <Stack.Screen
            name="Battle"
            component={BattleScreen}
            options={{
              headerShown: true,
              title: "Battle",
              headerStyle: { backgroundColor: "#2D6A4F" },
              headerTintColor: "#fff",
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}