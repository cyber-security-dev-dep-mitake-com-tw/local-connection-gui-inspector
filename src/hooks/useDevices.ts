import { useState, useEffect, useCallback, useRef } from "react";
import { getNetworkSnapshot } from "../lib/tauri";
import type { NetworkSnapshot } from "../lib/types";

export function useDevices(intervalMs: number = 5000) {
  const [snapshot, setSnapshot] = useState<NetworkSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await getNetworkSnapshot();
      setSnapshot(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefresh && intervalMs > 0) {
      intervalRef.current = setInterval(refresh, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, intervalMs, refresh]);

  return {
    snapshot,
    loading,
    error,
    autoRefresh,
    setAutoRefresh,
    refresh,
  };
}
