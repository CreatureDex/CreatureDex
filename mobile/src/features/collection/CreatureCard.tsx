import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { StatBar } from "../../components/StatBar";
import type { Creature } from "../../types";

interface CreatureCardProps {
  creature: Creature;
}

export function CreatureCard({ creature }: CreatureCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: creature.image_url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{creature.common_name}</Text>
        <Text style={styles.species}>{creature.species}</Text>
        <View style={styles.stats}>
          <StatBar label="HP" value={creature.hp} color="#E53935" />
          <StatBar label="ATK" value={creature.attack} color="#FB8C00" />
          <StatBar label="DEF" value={creature.defence} color="#1E88E5" />
          <StatBar label="SPD" value={creature.speed} color="#43A047" />
          <StatBar label="SPL" value={creature.special} color="#8E24AA" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: { width: "100%", height: 200, resizeMode: "cover" },
  info: { padding: 16 },
  name: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
  species: {
    fontSize: 14,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 12,
  },
  stats: { marginTop: 4 },
});