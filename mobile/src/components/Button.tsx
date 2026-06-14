import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  loading = false,
  variant = "primary",
  disabled = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? "#2D6A4F" : "#fff"} />
      ) : (
        <Text
          style={[styles.text, variant === "secondary" && styles.secondaryText]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 6,
  },
  primary: { backgroundColor: "#2D6A4F" },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#2D6A4F",
  },
  danger: { backgroundColor: "#D32F2F" },
  disabled: { opacity: 0.5 },
  text: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryText: { color: "#2D6A4F" },
});