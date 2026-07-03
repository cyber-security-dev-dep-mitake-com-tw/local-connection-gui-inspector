import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { startCapture, stopCapture, listInterfaces } from "../../lib/tauri";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { PacketInfo } from "../../lib/types";

export function PacketCaptureTool() {
  const { t } = useTranslation();
  const [interfaces, setInterfaces] = useState<string[]>([]);
  const [selectedInterface, setSelectedInterface] = useState("");
  const [filter, setFilter] = useState("");
  const [maxPackets, setMaxPackets] = useState(1000);
  const [isCapturing, setIsCapturing] = useState(false);
  const [packets, setPackets] = useState<PacketInfo[]>([]);

  useEffect(() => {
    loadInterfaces();
  }, []);

  const loadInterfaces = async () => {
    try {
      const devs = await listInterfaces();
      setInterfaces(devs);
      if (devs.length > 0) {
        setSelectedInterface(devs[0]);
      }
    } catch (e) {
      console.error("Failed to load interfaces:", e);
    }
  };

  const handleStart = async () => {
    if (!selectedInterface) return;
    try {
      await startCapture(selectedInterface, filter || undefined, maxPackets);
      setIsCapturing(true);
      setPackets([]);
    } catch (e) {
      console.error("Failed to start capture:", e);
    }
  };

  const handleStop = async () => {
    try {
      const capturedPackets = await stopCapture();
      setPackets(capturedPackets);
      setIsCapturing(false);
    } catch (e) {
      console.error("Failed to stop capture:", e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 font-mono mb-1 block">
            {t("tools.interface")}
          </label>
          <select
            value={selectedInterface}
            onChange={(e) => setSelectedInterface(e.target.value)}
            className="input-cyber w-full px-3 py-2 rounded-lg text-sm"
            disabled={isCapturing}
          >
            {interfaces.map((iface) => (
              <option key={iface} value={iface}>
                {iface}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 font-mono mb-1 block">
            {t("tools.filter")}
          </label>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("tools.filter_placeholder")}
            className="input-cyber w-full px-3 py-2 rounded-lg text-sm"
            disabled={isCapturing}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 font-mono">{t("tools.max_packets")}:</label>
          <input
            type="number"
            value={maxPackets}
            onChange={(e) => setMaxPackets(Number(e.target.value))}
            min={10}
            max={100000}
            className="input-cyber w-24 px-2 py-2 rounded-lg text-sm text-center"
            disabled={isCapturing}
          />
        </div>

        <div className="flex-1"></div>

        {!isCapturing ? (
          <button
            onClick={handleStart}
            disabled={!selectedInterface}
            className="btn-cyber px-4 py-2 rounded-lg text-sm font-mono disabled:opacity-50"
          >
            {t("tools.start_capture")}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-4 py-2 rounded-lg text-sm font-mono bg-[#ff0040]/20 border border-[#ff0040]/50 text-[#ff0040] hover:bg-[#ff0040]/30 transition-colors"
          >
            {t("tools.stop_capture")}
          </button>
        )}
      </div>

      {isCapturing && (
        <div className="card-cyber rounded-lg p-3 flex items-center gap-3">
          <StatusIndicator active={true} />
          <span className="text-sm font-mono text-[#ff0040]">
            {t("tools.running")}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            {t("tools.captured")}: {packets.length} packets
          </span>
        </div>
      )}

      {packets.length > 0 && (
        <div className="card-cyber rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-auto">
            <table className="table-cyber w-full">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">{t("tools.source")}</th>
                  <th className="px-3 py-2 text-left">{t("tools.destination")}</th>
                  <th className="px-3 py-2 text-left">{t("device.protocol")}</th>
                  <th className="px-3 py-2 text-right">{t("tools.length")}</th>
                  <th className="px-3 py-2 text-left">{t("device.details")}</th>
                </tr>
              </thead>
              <tbody>
                {packets.map((pkt, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">
                      <span className="text-[#00d4ff]">{pkt.source_ip}</span>
                      {pkt.source_port && (
                        <span className="text-gray-500">:{pkt.source_port}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="text-[#bf5af2]">{pkt.dest_ip}</span>
                      {pkt.dest_port && (
                        <span className="text-gray-500">:{pkt.dest_port}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-[#ffd60a]">{pkt.protocol}</td>
                    <td className="px-3 py-1.5 text-right text-gray-400">{pkt.length}</td>
                    <td className="px-3 py-1.5 text-gray-500 truncate max-w-[200px]">
                      {pkt.info}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
