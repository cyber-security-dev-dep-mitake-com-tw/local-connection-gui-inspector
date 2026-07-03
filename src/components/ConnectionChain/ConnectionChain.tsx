import { useTranslation } from "react-i18next";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { DeviceInfo } from "../../lib/types";

interface ConnectionChainProps {
  device: DeviceInfo;
  allDevices: DeviceInfo[];
}

export function ConnectionChain({ device, allDevices }: ConnectionChainProps) {
  const { t } = useTranslation();

  const gateway = device.layer3?.default_gateway;
  const connections = device.connections;

  const remoteHosts = Array.from(
    new Set(connections.map((c) => c.remote_addr).filter((a) => a !== "0.0.0.0" && a !== "127.0.0.1"))
  ).slice(0, 10);

  return (
    <div className="card-cyber rounded-xl p-4">
      <h3 className="text-sm font-bold font-mono text-[#00d4ff] mb-4">
        ◈ {t("device.connections")} — {device.name}
      </h3>

      <div className="flex items-start gap-4 overflow-x-auto pb-4">
        {/* Local Device */}
        <div className="flex-shrink-0 text-center">
          <div className="card-cyber rounded-lg p-3 min-w-[140px] border-[#00ff41]/30">
            <StatusIndicator active={device.is_active} />
            <p className="text-xs font-mono text-[#00ff41] mt-2">{device.name}</p>
            <p className="text-xs font-mono text-gray-500 mt-0.5">
              {device.layer3?.ipv4_addresses[0] ?? "N/A"}
            </p>
            <p className="text-xs font-mono text-gray-600 mt-0.5">
              {device.layer1?.mac_address ?? "N/A"}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center self-center">
          <div className="w-8 h-px bg-[#1e3a5f]"></div>
          <div className="text-[#1e3a5f]">→</div>
          <div className="w-8 h-px bg-[#1e3a5f]"></div>
        </div>

        {/* Gateway */}
        {gateway && (
          <>
            <div className="flex-shrink-0 text-center">
              <div className="card-cyber rounded-lg p-3 min-w-[140px] border-[#bf5af2]/30">
                <StatusIndicator active={true} />
                <p className="text-xs font-mono text-[#bf5af2] mt-2">Gateway</p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{gateway}</p>
              </div>
            </div>
            <div className="flex items-center self-center">
              <div className="w-8 h-px bg-[#1e3a5f]"></div>
              <div className="text-[#1e3a5f]">→</div>
              <div className="w-8 h-px bg-[#1e3a5f]"></div>
            </div>
          </>
        )}

        {/* Remote Hosts */}
        {remoteHosts.map((host) => {
          const hostConnections = connections.filter((c) => c.remote_addr === host);
          const primaryConn = hostConnections[0];
          const protocols = [...new Set(hostConnections.map((c) => c.protocol))];

          return (
            <div key={host} className="flex-shrink-0 text-center">
              <div className="card-cyber rounded-lg p-3 min-w-[140px] border-[#ffd60a]/30">
                <StatusIndicator active={hostConnections.some((c) => c.is_active)} />
                <p className="text-xs font-mono text-[#ffd60a] mt-2 truncate max-w-[120px]">
                  {host}
                </p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">
                  {protocols.join(", ")}
                </p>
                <p className="text-xs font-mono text-gray-600 mt-0.5">
                  {hostConnections.length} conn
                </p>
              </div>
            </div>
          );
        })}

        {remoteHosts.length === 0 && (
          <div className="flex-shrink-0 text-center self-center">
            <p className="text-xs text-gray-500 font-mono">No active connections</p>
          </div>
        )}
      </div>
    </div>
  );
}
