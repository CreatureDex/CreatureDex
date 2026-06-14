import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useAuth } from "../auth/useAuth";
import type { BattleCreatureState, RootStackParamList } from "../../types";
import { useBattle } from "./useBattle";

type Props = NativeStackScreenProps<RootStackParamList, "Battle">;

function HpBar({ creature, isMine }: { creature: BattleCreatureState; isMine: boolean }) {
  const pct = Math.max(0, (creature.current_hp / creature.max_hp) * 100);
  return (
    <View style={styles.hpPanel}>
      <Text style={styles.creatureName}>{creature.common_name}</Text>
      <View style={styles.hpTrack}>
        <View
          style={[
            styles.hpFill,
            { width: `${pct}%`, backgroundColor: isMine ? "#2D6A4F" : "#D32F2F" },
          ]}
        />
      </View>
      <Text style={styles.hpText}>
        {creature.current_hp} / {creature.max_hp} HP
      </Text>
    </View>
  );
}

export function BattleScreen({ route, navigation }: Props) {
  const { battleId } = route.params;
  const { battle, loading, attack } = useBattle(battleId);
  const { user } = useAuth();
  const [attacking, setAttacking] = useState(false);

  if (loading || !battle?.state) {
    return <LoadingSpinner message="Loading battle..." />;
  }

  const { state } = battle;
  const isChallenger = user?.id === battle.challenger_id;
  const mine = isChallenger ? state.challenger_creature : state.opponent_creature;
  const theirs = isChallenger ? state.opponent_creature : state.challenger_creature;
  const isMyTurn = battle.turn === user?.id;
  const isFinished = battle.status === "finished";
  const didWin = battle.winner_id === user?.id;

  const handleAttack = async () => {
    setAttacking(true);
    try {
      await attack(battleId);
    } catch (err: unknown) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setAttacking(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Opponent */}
      {theirs && <HpBar creature={theirs} isMine={false} />}

      {/* Battle log */}
      <FlatList
        data={[...state.log].reverse()}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <Text style={styles.logEntry}>{item}</Text>}
        style={styles.log}
        contentContainerStyle={styles.logContent}
      />

      {/* You */}
      {mine && <HpBar creature={mine} isMine />}

      {/* Action area */}
      <View style={styles.actions}>
        {isFinished ? (
          <>
            <Text style={styles.result}>
              {didWin ? "🏆 You Win!" : "💀 You Lost"}
            </Text>
            <Button title="Back to Battles" onPress={() => navigation.goBack()} />
          </>
        ) : isMyTurn ? (
          <Button
            title="⚔️  Attack!"
            onPress={handleAttack}
            loading={attacking}
          />
        ) : (
          <Text style={styles.waiting}>Waiting for opponent...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  hpPanel: { padding: 16, backgroundColor: "#fff", marginBottom: 2 },
  creatureName: { fontSize: 18, fontWeight: "700", color: "#1A1A1A", marginBottom: 6 },
  hpTrack: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  hpFill: { height: "100%", borderRadius: 5 },
  hpText: { fontSize: 12, color: "#888", marginTop: 4 },
  log: { flex: 1, backgroundColor: "#FAFAFA" },
  logContent: { padding: 16, gap: 6 },
  logEntry: { fontSize: 14, color: "#444", lineHeight: 20 },
  actions: { padding: 20, backgroundColor: "#fff" },
  result: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    color: "#1A1A1A",
  },
  waiting: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    paddingVertical: 12,
  },
});