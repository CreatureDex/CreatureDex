import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useCollection } from "../collection/useCollection";
import type { Creature, RootStackParamList } from "../../types";
import { useBattle } from "./useBattle";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BattleSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { creatures, loading: creaturesLoading } = useCollection();
  const { battles, loading: battlesLoading, fetchBattles, createBattle, acceptBattle } =
    useBattle();
  const [opponentId, setOpponentId] = useState("");
  const [selected, setSelected] = useState<Creature | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  const handleChallenge = async () => {
    if (!opponentId.trim() || !selected) {
      Alert.alert("Missing info", "Enter an opponent ID and select a creature.");
      return;
    }
    setSubmitting(true);
    try {
      const b = await createBattle(opponentId.trim(), selected.id);
      navigation.navigate("Battle", { battleId: b.id });
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (battleId: string) => {
    if (!selected) {
      Alert.alert("Select a creature", "Choose a creature before accepting.");
      return;
    }
    setSubmitting(true);
    try {
      await acceptBattle(battleId, selected.id);
      navigation.navigate("Battle", { battleId });
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (creaturesLoading || battlesLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  const pending = battles.filter((b) => b.status === "pending");
  const active = battles.filter((b) => b.status === "active");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {active.length > 0 && (
        <>
          <Text style={styles.section}>Active Battles</Text>
          {active.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.card}
              onPress={() => navigation.navigate("Battle", { battleId: b.id })}
            >
              <Text style={styles.cardTitle}>⚔️ Battle in progress</Text>
              <Text style={styles.cardSub}>Tap to continue</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {pending.length > 0 && (
        <>
          <Text style={styles.section}>Incoming Challenges</Text>
          {pending.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.card}
              onPress={() => handleAccept(b.id)}
            >
              <Text style={styles.cardTitle}>📩 Challenge received</Text>
              <Text style={styles.cardSub}>Tap to accept</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      <Text style={styles.section}>Select Your Creature</Text>
      <FlatList
        data={creatures}
        horizontal
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selected?.id === item.id && styles.chipSelected]}
            onPress={() => setSelected(item)}
          >
            <Text style={styles.chipName}>{item.common_name}</Text>
            <Text style={styles.chipHp}>HP {item.hp}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chips}
      />

      <Text style={styles.section}>Challenge a Trainer</Text>
      <TextInput
        style={styles.input}
        placeholder="Opponent's user ID"
        placeholderTextColor="#999"
        value={opponentId}
        onChangeText={setOpponentId}
        autoCapitalize="none"
      />
      <Button
        title="Send Challenge"
        onPress={handleChallenge}
        loading={submitting}
        disabled={!selected}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1A1A1A" },
  cardSub: { fontSize: 13, color: "#888", marginTop: 4 },
  chips: { gap: 8, paddingVertical: 4 },
  chip: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#DDD",
    marginRight: 8,
  },
  chipSelected: { borderColor: "#2D6A4F", backgroundColor: "#E8F5E9" },
  chipName: { fontWeight: "700", color: "#1A1A1A" },
  chipHp: { fontSize: 12, color: "#888", marginTop: 2 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    color: "#1A1A1A",
  },
});