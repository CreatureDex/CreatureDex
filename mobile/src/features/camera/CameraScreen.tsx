import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import type { RootStackParamList } from "../../types";
import { useCamera, type CaptureResult } from "./useCamera";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CameraScreen() {
  const navigation = useNavigation<Nav>();
  const { takePhoto, pickFromGallery } = useCamera();

  const handle = async (fn: () => Promise<CaptureResult | null>) => {
    const result = await fn();
    if (result) {
      navigation.navigate("Preview", {
        imageUri: result.uri,
        imageBase64: result.base64,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📸</Text>
        <Text style={styles.title}>Capture a Creature</Text>
        <Text style={styles.subtitle}>
          Point your camera at any animal or insect to identify it and add it to
          your collection.
        </Text>
      </View>
      <View style={styles.buttons}>
        <Button title="Take Photo" onPress={() => handle(takePhoto)} />
        <Button
          title="Choose from Gallery"
          onPress={() => handle(pickFromGallery)}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    justifyContent: "space-between",
    padding: 24,
  },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#1A1A1A", marginBottom: 8 },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  buttons: { paddingBottom: 20 },
});