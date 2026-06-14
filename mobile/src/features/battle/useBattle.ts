import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import type { Battle } from "../../types";

export function useBattle(battleId?: string) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- List all battles ---------------------------------------------------
  const fetchBattles = useCallback(async () => {
    setLoading(true);
    try {
      setBattles(await apiFetch<Battle[]>("/battles/"));
    } catch (err) {
      console.error("Failed to fetch battles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Single battle ------------------------------------------------------
  const fetchBattle = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setBattle(await apiFetch<Battle>(`/battles/${id}`));
    } catch (err) {
      console.error("Failed to fetch battle:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Actions ------------------------------------------------------------
  const createBattle = async (opponentId: string, creatureId: string) => {
    const data = await apiFetch<Battle>("/battles/", {
      method: "POST",
      body: JSON.stringify({
        opponent_id: opponentId,
        creature_id: creatureId,
      }),
    });
    setBattle(data);
    return data;
  };

  const acceptBattle = async (id: string, creatureId: string) => {
    const data = await apiFetch<Battle>(`/battles/${id}/accept`, {
      method: "POST",
      body: JSON.stringify({ creature_id: creatureId }),
    });
    setBattle(data);
    return data;
  };

  const attack = async (id: string) => {
    const data = await apiFetch<Battle>(`/battles/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action: "attack" }),
    });
    setBattle(data);
    return data;
  };

  // ---- Realtime subscription for a specific battle ------------------------
  useEffect(() => {
    if (!battleId) return;
    fetchBattle(battleId);

    const channel = supabase
      .channel(`battle:${battleId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "battles",
          filter: `id=eq.${battleId}`,
        },
        (payload) => setBattle(payload.new as Battle),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [battleId, fetchBattle]);

  return {
    battle,
    battles,
    loading,
    fetchBattles,
    fetchBattle,
    createBattle,
    acceptBattle,
    attack,
  };
}