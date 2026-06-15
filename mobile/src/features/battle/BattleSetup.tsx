import React, { useCallback, useState } from "react";
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
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useAuth } from "../auth/useAuth";
import { useCollection } from "../collection/useCollection";
import type { Creature, RootStackParamList } from "../../types";
import { useBattle } from "./useBattle";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BattleSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { creatures, loading: creaturesLoading } = useCollection();
  const { battles, loading: battlesLoading, fetchBattles, createBattle, acceptBattle } =
    useBattle();
  const [opponentId, setOpponentId] = useState("");
  const [selected, setSelected] = useState<Creature | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBattles();
    }, [fetchBattles]),
  );

  const copyTrainerId = async () => {
    if (!user?.id) return;
    await Clipboard.setStringAsync(user.id);
    Alert.alert("Copied!", "Your Trainer ID has been copied. Share it with your opponent.");
  };

  const handleChallenge = async () => {
    if (!opponentId.trim() || !selected) {
      Alert.alert("Missing info", "Enter an opponent's Trainer ID and select a creature.");
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
      Alert.alert("Select a creature", "Choose a creature first, then tap the challenge to accept.");
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

  // Split battles by role and status
  const incoming = battles.filter(
    (b) => b.status === "pending" && b.opponent_id === user?.id,
  );
  const sent = battles.filter(
    (b) => b.status === "pending" && b.challenger_id === user?.id,
  );
  const active = battles.filter((b) => b.status === "active");
  const finished = battles.filter((b) => b.status === "finished").slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Trainer ID card */}
      <View style={styles.idCard}>
        <Text style={styles.idLabel}>YOUR TRAINER ID</Text>
        <TouchableOpacity style={styles.idRow} onPress={copyTrainerId}>
          <Text style={styles.idValue} numberOfLines={1} ellipsizeMode="middle">
            {user?.id ?? "—"}
          </Text>
          <Text style={styles.copyIcon}>📋</Text>
        </TouchableOpacity>
        <Text style={styles.idHint}>Share this ID with friends so they can challenge you</Text>
      </View>

      {/* Active battles */}
      {active.length > 0 && (
        <>
          <Text style={styles.section}>⚔️ Active Battles</Text>
          {active.map((b) => {
            const isMyTurn = b.turn === user?.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.card, isMyTurn && styles.cardHighlight]}
                onPress={() => navigation.navigate("Battle", { battleId: b.id })}
              >
                <Text style={styles.cardTitle}>
                  {isMyTurn ? "🟢 Your turn!" : "⏳ Opponent's turn"}
                </Text>
                <Text style={styles.cardSub}>Tap to view battle</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Incoming challenges (you are the opponent — can accept) */}
      {incoming.length > 0 && (
        <>
          <Text style={styles.section}>📩 Incoming Challenges</Text>
          {incoming.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.card, styles.cardIncoming]}
              onPress={() => handleAccept(b.id)}
            >
              <Text style={styles.cardTitle}>New challenge!</Text>
              <Text style={styles.cardSub}>
                {selected
                  ? `Tap to accept with ${selected.common_name}`
                  : "Select a creature below first"}
              </Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Sent challenges (you are the challenger — waiting) */}
      {sent.length > 0 && (
        <>
          <Text style={styles.section}>📤 Sent Challenges</Text>
          {sent.map((b) => (
            <View key={b.id} style={[styles.card, styles.cardSent]}>
              <Text style={styles.cardTitle}>Waiting for opponent...</Text>
              <Text style={styles.cardSub}>Challenge sent</Text>
            </View>
          ))}
        </>
      )}

      {/* Recent results */}
      {finished.length > 0 && (
        <>
          <Text style={styles.section}>🏆 Recent Results</Text>
          {finished.map((b) => {
            const won = b.winner_id === user?.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.card}
                onPress={() => navigation.navigate("Battle", { battleId: b.id })}
              >
                <Text style={styles.cardTitle}>{won ? "🏆 Victory!" : "💀 Defeat"}</Text>
                <Text style={styles.cardSub}>Tap to review</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Creature picker */}
      <Text style={styles.section}>Select Your Creature</Text>
      {creatures.length === 0 ? (
        <Text style={styles.emptyHint}>
          Capture at least one creature before battling!
        </Text>
      ) : (
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
              <Text style={styles.chipStats}>
                HP {item.hp} · ATK {item.attack} · SPD {item.speed}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.chips}
        />
      )}

      {/* Challenge form */}
      <Text style={styles.section}>Challenge a Trainer</Text>
      <TextInput
        style={styles.input}
        placeholder="Paste opponent's Trainer ID"
        placeholderTextColor="#999"
        value={opponentId}
        onChangeText={setOpponentId}
        autoCapitalize="none"
      />
      <Button
        title="Send Challenge ⚔️"
        onPress={handleChallenge}
        loading={submitting}
        disabled={!selected || !opponentId.trim()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  content: { padding: 20, paddingBottom: 40 },
  idCard: {
    backgroundColor: "#2D6A4F",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
  },
  idLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A8D5BA",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  idValue: { flex: 1, fontSize: 14, fontFamily: "monospace", color: "#fff" },
  copyIcon: { fontSize: 18, marginLeft: 8 },
  idHint: { fontSize: 12, color: "#A8D5BA" },
  section: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 22,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#DDD",
    elevation: 1,
  },
  cardHighlight: { borderLeftColor: "#2D6A4F", backgroundColor: "#F0FAF4" },
  cardIncoming: { borderLeftColor: "#FB8C00", backgroundColor: "#FFF8F0" },
  cardSent: { borderLeftColor: "#90A4AE", opacity: 0.7 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1A1A1A" },
  cardSub: { fontSize: 13, color: "#888", marginTop: 3 },
  emptyHint: { fontSize: 14, color: "#888", fontStyle: "italic", marginBottom: 8 },
  chips: { paddingVertical: 4 },
  chip: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    marginRight: 10,
    minWidth: 120,
  },
  chipSelected: { borderColor: "#2D6A4F", backgroundColor: "#E8F5E9" },
  chipName: { fontWeight: "700", fontSize: 14, color: "#1A1A1A" },
  chipStats: { fontSize: 11, color: "#888", marginTop: 3 },
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