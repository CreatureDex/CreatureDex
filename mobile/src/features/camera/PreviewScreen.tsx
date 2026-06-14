import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { supabase } from "../../lib/supabase";
import type { Creature, RootStackParamList } from "../../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

type Props = NativeStackScreenProps<RootStackParamList, "Preview">;

export function PreviewScreen({ route, navigation }: Props) {
  const { imageUri, imageBase64 } = route.params;
  const [loading, setLoading] = useState(false);

  const handleIdentify = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      // Send as base64 JSON — avoids all RN FormData/Blob issues
      const response = await fetch(`${API_URL}/creatures/identify-base64`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(err.detail ?? "Identification failed");
      }

      const result: Creature = await response.json();

      Alert.alert(
        "Creature Identified!",
        `You found a ${result.common_name} (${result.species})!`,
        [{ text: "View Collection", onPress: () => navigation.popToTop() }],
      );
    } catch (err: unknown) {
      Alert.alert("Identification Failed", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Identifying creature..." />;

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.actions}>
        <Text style={styles.hint}>
          Make sure the creature is clearly visible in the photo.
        </Text>
        <Button title="Identify Creature" onPress={handleIdentify} />
        <Button
          title="Retake"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A1A" },
  image: { flex: 1, resizeMode: "contain" },
  actions: {
    padding: 24,
    backgroundColor: "#F5F5F0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
});