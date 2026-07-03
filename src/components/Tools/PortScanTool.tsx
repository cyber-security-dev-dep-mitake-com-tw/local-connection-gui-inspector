import { useState } from "react";
import { useTranslation } from "react-i18next";
import { portScan } from "../../lib/tauri";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { PortScanResult } from "../../lib/types";

export function PortScanTool() {
  const { t } = useTranslation();
  const [host, setHost] = useState("");
  const [result, setResult] = useState<PortScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!host.trim()) return;
    setLoading(true);
    try {
      const r = await portScan(host);
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
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
        />
        <button
          onClick={handleScan}
          disabled={loading || !host.trim()}
          className="btn-cyber px-4 py-2 rounded-lg text-sm font-mono disabled:opacity-50"
        >
          {loading ? t("tools.scanning") : t("tools.run")}
        </button>
      </div>

      {result && (
        <div className="card-cyber rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIndicator active={result.open_ports.length > 0} />
              <span className="text-sm font-mono text-[#00d4ff]">
                {result.host} ({result.ip})
              </span>
            </div>
            <span className="text-xs text-gray-500 font-mono">
              {result.scan_time_ms}ms
            </span>
          </div>

          <div className="text-xs font-mono text-gray-400">
            {result.open_ports.length} {t("tools.open_ports").toLowerCase()}
          </div>

          {result.open_ports.length > 0 ? (
            <div className="space-y-1">
              {result.open_ports.map((port) => (
                <div
                  key={port.port}
                  className="flex items-center justify-between py-1.5 px-3 rounded bg-[#0a0e17] border border-[#1e3a5f]/30"
                >
                  <div className="flex items-center gap-3">
                    <StatusIndicator active={true} size="sm" />
                    <span className="text-sm font-mono text-[#00ff41]">
                      {port.port}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {port.service}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {port.state}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-mono text-center py-4">
              {t("common.no_data")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
