import { useTranslation } from "react-i18next";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { DeviceInfo, ConnectionInfo } from "../../lib/types";

interface ConnectionChainProps {
  device: DeviceInfo;
  allDevices: DeviceInfo[];
}

export function ConnectionChain({ device, allDevices: _allDevices }: ConnectionChainProps) {
  const { t } = useTranslation();

  const gateway = device.layer3?.default_gateway;
  const connections = device.connections;

  const allRemoteHosts = Array.from(
    new Set(connections.map((c) => c.remote_addr))
  ).filter((a) => a !== "0.0.0.0");

  const externalHosts = allRemoteHosts.filter((a) => a !== "127.0.0.1");
  const localHosts = allRemoteHosts.filter((a) => a === "127.0.0.1");

  const displayHosts = [...externalHosts, ...localHosts].slice(0, 20);

  return (
    <div className="card-cyber rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold font-mono text-[#00d4ff]">
          ◈ {t("device.connections")} — {device.name}
        </h3>
        <span className="text-xs font-mono text-gray-500">
          {connections.length} {t("device.connections").toLowerCase()}
        </span>
      </div>

      <div className="flex items-start gap-3 overflow-x-auto pb-4">
        {/* Local Device */}
        <div className="flex-shrink-0 text-center">
          <div className="card-cyber rounded-lg p-3 min-w-[130px] border-[#00ff41]/30">
            <StatusIndicator active={device.is_active} />
            <p className="text-xs font-mono text-[#00ff41] mt-2">{device.name}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">
              {device.layer3?.ipv4_addresses[0] ?? "N/A"}
            </p>
            <p className="text-[10px] font-mono text-gray-600 mt-0.5">
              {device.layer1?.mac_address ?? "N/A"}
            </p>
          </div>
        </div>

        {/* Arrow */}
        {displayHosts.length > 0 && (
          <div className="flex items-center self-center flex-shrink-0">
            <div className="w-6 h-px bg-[#1e3a5f]" />
            <div className="text-[#1e3a5f] text-xs mx-1">→</div>
            <div className="w-6 h-px bg-[#1e3a5f]" />
          </div>
        )}

        {/* Gateway */}
        {gateway && (
          <>
            <div className="flex-shrink-0 text-center">
              <div className="card-cyber rounded-lg p-3 min-w-[130px] border-[#bf5af2]/30">
                <StatusIndicator active={true} />
                <p className="text-xs font-mono text-[#bf5af2] mt-2">{t("settings.tree_gateway")}</p>
                <p className="text-[10px] font-mono text-gray-500 mt-0.5">{gateway}</p>
              </div>
            </div>
            <div className="flex items-center self-center flex-shrink-0">
              <div className="w-6 h-px bg-[#1e3a5f]" />
              <div className="text-[#1e3a5f] text-xs mx-1">→</div>
              <div className="w-6 h-px bg-[#1e3a5f]" />
            </div>
          </>
        )}

        {/* Remote / Local Hosts */}
        {displayHosts.map((host) => {
          const hostConns = connections.filter((c) => c.remote_addr === host);
          const activeConns = hostConns.filter((c) => c.is_active);
          const inactiveConns = hostConns.filter((c) => !c.is_active);
          const protocols = [...new Set(hostConns.map((c) => c.protocol))];
          const processes = [...new Set(hostConns.map((c) => c.process_name).filter(Boolean))];
          const isLocal = host === "127.0.0.1";
          const borderColor = isLocal ? "#6b7280" : "#ffd60a";
          const labelColor = isLocal ? "#9ca3af" : "#ffd60a";

          return (
            <div key={host} className="flex-shrink-0 text-center">
              <div
                className="card-cyber rounded-lg p-3 min-w-[140px] max-w-[180px]"
                style={{ borderColor: `${borderColor}40` }}
              >
                <StatusIndicator active={activeConns.length > 0} />
                <p
                  className="text-xs font-mono mt-2 truncate max-w-[120px]"
                  style={{ color: labelColor }}
                >
                  {isLocal ? "127.0.0.1 (Local)" : host}
                </p>
                <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                  {protocols.join(", ")}
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {activeConns.length > 0 && (
                    <span className="text-[10px] font-mono text-[#00ff41]">
                      {activeConns.length} active
                    </span>
                  )}
                  {inactiveConns.length > 0 && (
                    <span className="text-[10px] font-mono text-[#ff0040]">
                      {inactiveConns.length} idle
                    </span>
                  )}
                </div>
                {processes.length > 0 && (
                  <p className="text-[9px] font-mono text-gray-600 mt-1 truncate">
                    {processes.slice(0, 2).join(", ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {displayHosts.length === 0 && (
          <div className="flex-shrink-0 text-center self-center">
            <p className="text-xs text-gray-500 font-mono">
              {connections.length > 0
                ? `${connections.length} ${t("device.connections").toLowerCase()} (${t("device.is_up")}: ${t("status.listening")})`
                : t("common.no_data")}
            </p>
          </div>
        )}
      </div>

      {/* Detailed connection list below the chain */}
      {connections.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#1e3a5f]/50">
          <details className="group">
            <summary className="text-xs font-mono text-gray-400 cursor-pointer hover:text-gray-300 select-none">
              {t("device.connections")} ({connections.length}) — {t("common.expand")}
            </summary>
            <div className="mt-2 max-h-48 overflow-auto space-y-0.5">
              {connections.map((conn, i) => (
                <ConnectionRow key={i} conn={conn} />
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function ConnectionRow({ conn }: { conn: ConnectionInfo }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-mono py-0.5 px-2 rounded hover:bg-[#111827]">
      <StatusIndicator active={conn.is_active} size="sm" />
      <span className="text-gray-400 w-[140px] truncate">
        {conn.local_addr}:{conn.local_port}
      </span>
      <span className="text-gray-600">→</span>
      <span className="text-gray-300 w-[140px] truncate">
        {conn.remote_addr}:{conn.remote_port}
      </span>
      <span className="text-[#ffd60a] w-10">{conn.protocol}</span>
      <span className="text-gray-500 w-20 truncate">{conn.state}</span>
      {conn.process_name && (
        <span className="text-gray-600 truncate">{conn.process_name}</span>
      )}
    </div>
  );
}
