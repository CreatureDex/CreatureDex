import React, { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { useAuth } from "../auth/useAuth";
import type { BattleCreatureState, RootStackParamList } from "../../types";
import { useBattle } from "./useBattle";

type Props = NativeStackScreenProps<RootStackParamList, "Battle">;

function getHpColor(pct: number): string {
  if (pct > 0.5) return "#43A047";
  if (pct > 0.25) return "#FB8C00";
  return "#E53935";
}

function CreaturePanel({
  creature,
  isMine,
  label,
}: {
  creature: BattleCreatureState;
  isMine: boolean;
  label: string;
}) {
  const pct = Math.max(0, creature.current_hp / creature.max_hp);
  const color = getHpColor(pct);

  return (
    <View style={[styles.panel, isMine ? styles.panelMine : styles.panelTheirs]}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelLabel}>{label}</Text>
        <Text style={[styles.hpNumber, { color }]}>
          {creature.current_hp}/{creature.max_hp}
        </Text>
      </View>
      <Text style={styles.creatureName}>{creature.common_name}</Text>
      <View style={styles.hpTrack}>
        <View style={[styles.hpFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.miniStats}>
        <Text style={styles.miniStat}>ATK {creature.attack}</Text>
        <Text style={styles.miniStat}>DEF {creature.defence}</Text>
        <Text style={styles.miniStat}>SPD {creature.speed}</Text>
      </View>
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
  const isPending = battle.status === "pending";

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
      {/* Opponent panel */}
      {theirs ? (
        <CreaturePanel creature={theirs} isMine={false} label="OPPONENT" />
      ) : (
        <View style={styles.waitingPanel}>
          <Text style={styles.waitingEmoji}>⏳</Text>
          <Text style={styles.waitingText}>Waiting for opponent to accept...</Text>
        </View>
      )}

      {/* Battle log */}
      <View style={styles.logContainer}>
        <FlatList
          data={[...state.log].reverse()}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item, index }) => (
            <View style={[styles.logBubble, index === 0 && styles.logLatest]}>
              <Text style={[styles.logText, index === 0 && styles.logLatestText]}>
                {item}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.logContent}
          ListEmptyComponent={
            <Text style={styles.logEmpty}>
              {isPending ? "Challenge sent! Waiting for response..." : "Battle log will appear here"}
            </Text>
          }
        />
      </View>

      {/* Your creature panel */}
      {mine && <CreaturePanel creature={mine} isMine label="YOU" />}

      {/* Action area */}
      <View style={styles.actions}>
        {isFinished ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultEmoji}>{didWin ? "🏆" : "💀"}</Text>
            <Text style={styles.resultText}>{didWin ? "Victory!" : "Defeated"}</Text>
            <Button title="Back to Battles" onPress={() => navigation.goBack()} />
          </View>
        ) : isPending ? (
          <Text style={styles.waitingAction}>Waiting for opponent...</Text>
        ) : isMyTurn ? (
          <Button title="⚔️  Attack!" onPress={handleAttack} loading={attacking} />
        ) : (
          <View style={styles.opponentTurn}>
            <Text style={styles.opponentTurnEmoji}>⏳</Text>
            <Text style={styles.opponentTurnText}>Opponent's turn...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1A1A2E" },

  // Creature panels
  panel: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  panelTheirs: { backgroundColor: "#2A1A1A" },
  panelMine: { backgroundColor: "#1A2A1A" },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  panelLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888",
    letterSpacing: 1.5,
  },
  hpNumber: { fontSize: 14, fontWeight: "700" },
  creatureName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  hpTrack: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 5,
    overflow: "hidden",
  },
  hpFill: { height: "100%", borderRadius: 5 },
  miniStats: { flexDirection: "row", gap: 12, marginTop: 8 },
  miniStat: { fontSize: 11, color: "#999", fontWeight: "600" },

  // Waiting panel
  waitingPanel: {
    backgroundColor: "#2A2A3E",
    padding: 30,
    alignItems: "center",
  },
  waitingEmoji: { fontSize: 32, marginBottom: 8 },
  waitingText: { color: "#888", fontSize: 14 },

  // Battle log
  logContainer: { flex: 1, backgroundColor: "#16162A" },
  logContent: { padding: 16, gap: 6 },
  logBubble: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logLatest: { backgroundColor: "rgba(45,106,79,0.3)" },
  logText: { color: "#AAA", fontSize: 14, lineHeight: 20 },
  logLatestText: { color: "#fff", fontWeight: "600" },
  logEmpty: { color: "#666", fontSize: 14, textAlign: "center", paddingTop: 40 },

  // Actions
  actions: { padding: 16, backgroundColor: "#1A1A2E" },
  resultContainer: { alignItems: "center", paddingVertical: 8 },
  resultEmoji: { fontSize: 40, marginBottom: 4 },
  resultText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },
  waitingAction: { color: "#888", textAlign: "center", paddingVertical: 16 },
  opponentTurn: { alignItems: "center", paddingVertical: 12 },
  opponentTurnEmoji: { fontSize: 24, marginBottom: 4 },
  opponentTurnText: { color: "#888", fontSize: 15 },
});