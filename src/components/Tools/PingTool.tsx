import { useState } from "react";
import { useTranslation } from "react-i18next";
import { pingHost } from "../../lib/tauri";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { PingResult } from "../../lib/types";

export function PingTool() {
  const { t } = useTranslation();
  const [host, setHost] = useState("");
  const [count, setCount] = useState(4);
  const [result, setResult] = useState<PingResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePing = async () => {
    if (!host.trim()) return;
    setLoading(true);
    try {
      const r = await pingHost(host, count);
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
          onKeyDown={(e) => e.key === "Enter" && handlePing()}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-mono">{t("tools.count")}:</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min={1}
            max={20}
            className="input-cyber w-16 px-2 py-2 rounded-lg text-sm text-center"
          />
        </div>
        <button
          onClick={handlePing}
          disabled={loading || !host.trim()}
          className="btn-cyber px-4 py-2 rounded-lg text-sm font-mono disabled:opacity-50"
        >
          {loading ? t("tools.running") : t("tools.run")}
        </button>
      </div>

      {result && (
        <div className="card-cyber rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <StatusIndicator active={result.loss_percent < 100} />
            <span className="text-sm font-mono text-[#00d4ff]">
              {result.host} ({result.ip})
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label={t("tools.packets_sent")} value={String(result.packets_sent)} color="#00d4ff" />
            <StatBox label={t("tools.packets_received")} value={String(result.packets_received)} color="#00ff41" />
            <StatBox label={t("tools.packet_loss")} value={`${result.loss_percent.toFixed(1)}%`} color={result.loss_percent > 0 ? "#ff0040" : "#00ff41"} />
            <StatBox label={t("tools.rtt_avg")} value={result.avg_rtt ? `${result.avg_rtt.toFixed(2)} ${t("tools.ms")}` : "N/A"} color="#ffd60a" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#1e3a5f]/50">
            <StatBox label={t("tools.rtt_min")} value={result.min_rtt ? `${result.min_rtt.toFixed(2)} ${t("tools.ms")}` : "N/A"} color="#00d4ff" />
            <StatBox label={t("tools.rtt_avg")} value={result.avg_rtt ? `${result.avg_rtt.toFixed(2)} ${t("tools.ms")}` : "N/A"} color="#ffd60a" />
            <StatBox label={t("tools.rtt_max")} value={result.max_rtt ? `${result.max_rtt.toFixed(2)} ${t("tools.ms")}` : "N/A"} color="#ff0040" />
          </div>

          {result.times.length > 0 && (
            <div className="pt-2 border-t border-[#1e3a5f]/50">
              <p className="text-xs text-gray-500 mb-2 font-mono">Individual RTTs:</p>
              <div className="flex flex-wrap gap-1">
                {result.times.map((time, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-xs font-mono bg-[#0a0e17] border border-[#1e3a5f]/50"
                    style={{
                      color: time > 100 ? "#ff0040" : time > 50 ? "#ffd60a" : "#00ff41",
                    }}
                  >
                    {time.toFixed(2)}ms
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-mono">{label}</p>
      <p className="text-sm font-bold font-mono" style={{ color }}>
        {value}
      </p>
    </div>
  );
}
