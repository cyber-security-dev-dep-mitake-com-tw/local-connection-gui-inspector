import { useState } from "react";
import { useTranslation } from "react-i18next";
import { tracerouteHost } from "../../lib/tauri";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { TracerouteResult } from "../../lib/types";

export function TracerouteTool() {
  const { t } = useTranslation();
  const [host, setHost] = useState("");
  const [result, setResult] = useState<TracerouteResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTraceroute = async () => {
    if (!host.trim()) return;
    setLoading(true);
    try {
      const r = await tracerouteHost(host);
      setResult(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder={t("tools.host_input")}
          className="input-cyber flex-1 px-3 py-2 rounded-lg text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleTraceroute()}
        />
        <button
          onClick={handleTraceroute}
          disabled={loading || !host.trim()}
          className="btn-cyber px-4 py-2 rounded-lg text-sm font-mono disabled:opacity-50"
        >
          {loading ? t("tools.running") : t("tools.run")}
        </button>
      </div>

      {result && (
        <div className="card-cyber rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <StatusIndicator active={true} />
            <span className="text-sm font-mono text-[#00d4ff]">
              {result.host} ({result.ip})
            </span>
            <span className="text-xs text-gray-500 font-mono">
              {result.hops.length} hops
            </span>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-[40px_1fr_120px_120px_120px] gap-2 text-xs font-mono text-gray-500 px-3 py-1 border-b border-[#1e3a5f]/50">
              <span>#</span>
              <span>{t("tools.host")}</span>
              <span className="text-right">{t("tools.rtt_min")}</span>
              <span className="text-right">{t("tools.rtt_avg")}</span>
              <span className="text-right">{t("tools.rtt_max")}</span>
            </div>

            {result.hops.map((hop) => {
              const validTimes = hop.rtt.filter((t): t is number => t !== null);
              const avg = validTimes.length > 0
                ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
                : null;
              const min = validTimes.length > 0 ? Math.min(...validTimes) : null;
              const max = validTimes.length > 0 ? Math.max(...validTimes) : null;

              return (
                <div
                  key={hop.ttl}
                  className="grid grid-cols-[40px_1fr_120px_120px_120px] gap-2 text-xs font-mono py-1.5 px-3 rounded hover:bg-[#111827]"
                >
                  <span className="text-gray-500">{hop.ttl}</span>
                  <span className="text-gray-300 truncate">
                    {hop.ip ?? "*"}
                    {hop.hostname && hop.hostname !== hop.ip && (
                      <span className="text-gray-500 ml-1">({hop.hostname})</span>
                    )}
                  </span>
                  <span className="text-right" style={{ color: min !== null ? "#00ff41" : "#6b7280" }}>
                    {min !== null ? `${min.toFixed(2)} ms` : "*"}
                  </span>
                  <span className="text-right" style={{ color: avg !== null ? "#ffd60a" : "#6b7280" }}>
                    {avg !== null ? `${avg.toFixed(2)} ms` : "*"}
                  </span>
                  <span className="text-right" style={{ color: max !== null ? "#ff0040" : "#6b7280" }}>
                    {max !== null ? `${max.toFixed(2)} ms` : "*"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
