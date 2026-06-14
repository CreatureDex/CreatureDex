import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import type { Creature } from "../../types";

export function useCollection() {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Creature[]>("/creatures/");
      setCreatures(data);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { creatures, loading, error, refresh };
}