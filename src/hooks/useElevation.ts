import { useState, useEffect, useCallback } from "react";
import { checkElevation, requestElevation } from "../lib/tauri";
import type { ElevationStatus } from "../lib/types";

export function useElevation() {
  const [status, setStatus] = useState<ElevationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    try {
      const s = await checkElevation();
      setStatus(s);
    } catch (e) {
      console.error("Failed to check elevation:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const request = useCallback(async () => {
    try {
      const result = await requestElevation();
      if (result) {
        await check();
      }
      return result;
    } catch (e) {
      console.error("Failed to request elevation:", e);
      return false;
    }
  }, [check]);

  return { status, loading, request, check };
}
