import React from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { CreatureCard } from "./CreatureCard";
import { useCollection } from "./useCollection";

export function BagScreen() {
  const { creatures, loading, error, refresh } = useCollection();

  if (loading && creatures.length === 0) {
    return <LoadingSpinner message="Loading your collection..." />;
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={creatures}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CreatureCard creature={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            colors={["#2D6A4F"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No creatures yet</Text>
            <Text style={styles.emptyBody}>
              Go to the Camera tab to photograph your first creature!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  list: { paddingVertical: 8 },
  error: { color: "#D32F2F", textAlign: "center", padding: 12 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#333", marginBottom: 8 },
  emptyBody: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});