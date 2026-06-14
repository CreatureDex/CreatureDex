import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

export function StatBar({
  label,
  value,
  maxValue = 255,
  color = "#2D6A4F",
}: StatBarProps) {
  const pct = Math.min((value / maxValue) * 100, 100);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginVertical: 3 },
  label: {
    width: 48,
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
  },
  track: {
    flex: 1,
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
  value: {
    width: 30,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
  },
});