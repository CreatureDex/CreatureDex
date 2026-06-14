import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export interface CaptureResult {
  uri: string;
  base64: string;
}

export function useCamera() {
  const takePhoto = async (): Promise<CaptureResult | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Camera access is required to capture creatures.",
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64) return null;
    return { uri: result.assets[0].uri, base64: result.assets[0].base64 };
  };

  const pickFromGallery = async (): Promise<CaptureResult | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
    });

    if (result.canceled || !result.assets[0].base64) return null;
    return { uri: result.assets[0].uri, base64: result.assets[0].base64 };
  };

  return { takePhoto, pickFromGallery };
}