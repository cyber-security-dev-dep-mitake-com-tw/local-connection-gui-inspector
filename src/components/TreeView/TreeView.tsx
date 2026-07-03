import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { DeviceInfo, LanDevice, LayerKey } from "../../lib/types";

interface TreeViewProps {
  devices: DeviceInfo[];
  lanDevices: LanDevice[];
  activeLayers: LayerKey[];
  onDeviceSelect?: (device: DeviceInfo) => void;
}

function isPrivateIP(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  return false;
}

function isLoopback(ip: string): boolean {
  return ip === "127.0.0.1" || ip === "::1";
}

export function TreeView({
  devices,
  lanDevices,
  activeLayers: _activeLayers,
  onDeviceSelect,
}: TreeViewProps) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["pc", "lan", "gateway", "intranet", "internet"])
  );
  const [expandedDevices, setExpandedDevices] = useState<Set<string>>(new Set());
  const [expandedHosts, setExpandedHosts] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDevice = (id: string) => {
    setExpandedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleHost = (key: string) => {
    setExpandedHosts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const primaryDevice = devices.find((d) => d.is_active) ?? devices[0];
  const gateway = primaryDevice?.layer3?.default_gateway;

  const allConnections = devices.flatMap((d) =>
    d.connections.map((c) => ({ ...c, deviceName: d.name }))
  );

  const lanConns = allConnections.filter(
    (c) =>
      !isLoopback(c.remote_addr) &&
      c.remote_addr !== "0.0.0.0" &&
      isPrivateIP(c.remote_addr) &&
      c.remote_addr !== gateway
  );

  const internetConns = allConnections.filter(
    (c) =>
      !isLoopback(c.remote_addr) &&
      c.remote_addr !== "0.0.0.0" &&
      !isPrivateIP(c.remote_addr)
  );

  const gatewayConns = allConnections.filter(
    (c) => gateway && c.remote_addr === gateway
  );

  const localConns = allConnections.filter(
    (c) => isLoopback(c.remote_addr) || c.remote_addr === "0.0.0.0"
  );

  const groupedLan = groupByRemote(lanConns);
  const groupedInternet = groupByRemote(internetConns);
  const groupedGateway = groupByRemote(gatewayConns);
  const groupedLocal = groupByRemote(localConns);

  const lanDeviceIps = new Set(lanDevices.map((d) => d.ip));

  return (
    <div className="card-cyber rounded-xl p-5">
      <h2 className="text-sm font-bold font-mono text-[#00d4ff] mb-4">
        ⌥ {t("settings.tree")} — {t("stats.connections")}
      </h2>

      {devices.length === 0 ? (
        <p className="text-xs text-gray-500 font-mono text-center py-8">
          {t("common.no_data")}
        </p>
      ) : (
        <div className="space-y-0">
          {/* ── Section: Your PC ── */}
          <TreeNode
            id="pc"
            label={`💻 ${primaryDevice?.name ?? "PC"}`}
            subtitle={primaryDevice?.layer3?.ipv4_addresses[0] ?? "N/A"}
            color="#00ff41"
            expanded={expandedSections.has("pc")}
            onToggle={() => toggleSection("pc")}
            depth={0}
          >
            {devices.map((device) => (
              <TreeNode
                key={device.id}
                id={`dev-${device.id}`}
                label={device.name}
                subtitle={device.layer3?.ipv4_addresses[0] ?? "N/A"}
                color="#00d4ff"
                expanded={expandedDevices.has(device.id)}
                onToggle={() => toggleDevice(device.id)}
                depth={1}
                onInfo={() => onDeviceSelect?.(device)}
              >
                {/* Local / loopback */}
                {groupedLocal.size > 0 && (
                  <TreeNode
                    id="local"
                    label={`${t("osi.layer3")} — Local`}
                    color="#9ca3af"
                    expanded={expandedSections.has("local")}
                    onToggle={() => toggleSection("local")}
                    depth={2}
                  >
                    {Array.from(groupedLocal.entries()).map(([addr, conns]) => (
                      <HostNode
                        key={addr}
                        addr={addr}
                        conns={conns}
                        depth={3}
                        expanded={expandedHosts.has(`${device.id}-${addr}`)}
                        onToggle={() => toggleHost(`${device.id}-${addr}`)}
                      />
                    ))}
                  </TreeNode>
                )}

                {/* Gateway connections */}
                {gatewayConns.length > 0 && (
                  <TreeNode
                    id="gateway-conns"
                    label={`🔗 ${t("settings.tree_gateway")} (${gatewayConns.length})`}
                    color="#bf5af2"
                    expanded={expandedSections.has("gateway-conns")}
                    onToggle={() => toggleSection("gateway-conns")}
                    depth={2}
                  >
                    {Array.from(groupedGateway.entries()).map(([addr, conns]) => (
                      <HostNode
                        key={addr}
                        addr={addr}
                        conns={conns}
                        depth={3}
                        expanded={expandedHosts.has(`${device.id}-${addr}`)}
                        onToggle={() => toggleHost(`${device.id}-${addr}`)}
                      />
                    ))}
                  </TreeNode>
                )}

                {/* LAN / Intranet */}
                {lanConns.length > 0 && (
                  <TreeNode
                    id="intranet"
                    label={`🏠 Intranet (${lanConns.length})`}
                    color="#ffd60a"
                    expanded={expandedSections.has("intranet")}
                    onToggle={() => toggleSection("intranet")}
                    depth={2}
                  >
                    {Array.from(groupedLan.entries()).map(([addr, conns]) => (
                      <HostNode
                        key={addr}
                        addr={addr}
                        conns={conns}
                        depth={3}
                        expanded={expandedHosts.has(`${device.id}-${addr}`)}
                        onToggle={() => toggleHost(`${device.id}-${addr}`)}
                        macVendor={lanDeviceIps.has(addr) ? lanDevices.find((d) => d.ip === addr)?.vendor : undefined}
                      />
                    ))}
                  </TreeNode>
                )}

                {/* Internet */}
                {internetConns.length > 0 && (
                  <TreeNode
                    id="internet"
                    label={`🌐 Internet (${internetConns.length})`}
                    color="#ff2d55"
                    expanded={expandedSections.has("internet")}
                    onToggle={() => toggleSection("internet")}
                    depth={2}
                  >
                    {Array.from(groupedInternet.entries()).map(([addr, conns]) => (
                      <HostNode
                        key={addr}
                        addr={addr}
                        conns={conns}
                        depth={3}
                        expanded={expandedHosts.has(`${device.id}-${addr}`)}
                        onToggle={() => toggleHost(`${device.id}-${addr}`)}
                      />
                    ))}
                  </TreeNode>
                )}
              </TreeNode>
            ))}
          </TreeNode>

          {/* ── Section: LAN Devices ── */}
          {lanDevices.length > 0 && (
            <TreeNode
              id="lan"
              label={`📡 LAN Devices (${lanDevices.length})`}
              subtitle="ARP Table"
              color="#ffd60a"
              expanded={expandedSections.has("lan")}
              onToggle={() => toggleSection("lan")}
              depth={0}
            >
              {lanDevices.map((dev) => (
                <div
                  key={dev.ip}
                  className="flex items-center gap-2 pl-6 py-1 text-[10px] font-mono"
                >
                  <span className="text-[#1e3a5f]">├─</span>
                  <StatusIndicator active={dev.is_reachable} size="sm" />
                  <span className="text-[#ffd60a]">{dev.ip}</span>
                  <span className="text-gray-600">{dev.mac}</span>
                  <span className="text-gray-500 truncate">{dev.vendor}</span>
                </div>
              ))}
            </TreeNode>
          )}
        </div>
      )}
    </div>
  );
}

function groupByRemote(
  conns: Array<{
    remote_addr: string;
    remote_port: number;
    local_port: number;
    protocol: string;
    state: string;
    is_active: boolean;
    process_name?: string;
    deviceName: string;
  }>
): Map<string, typeof conns> {
  const map = new Map<string, typeof conns>();
  for (const c of conns) {
    const key = c.remote_addr;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return map;
}

function TreeNode({
  label,
  subtitle,
  color,
  expanded,
  onToggle,
  depth,
  children,
  onInfo,
}: {
  id: string;
  label: string;
  subtitle?: string;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  depth: number;
  children?: React.ReactNode;
  onInfo?: () => void;
}) {

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 hover:bg-[#111827]/50 rounded transition-colors cursor-pointer group"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={onToggle}
      >
        <span className="text-[10px] text-gray-600 font-mono w-3 flex-shrink-0">
          {children ? (expanded ? "▼" : "▶") : "─"}
        </span>
        <span className="text-xs font-mono font-semibold" style={{ color }}>
          {label}
        </span>
        {subtitle && (
          <span className="text-[10px] font-mono text-gray-500">{subtitle}</span>
        )}
        {onInfo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfo();
            }}
            className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-[#00d4ff] hover:text-[#00ff41] px-1.5 py-0.5 rounded border border-[#1e3a5f] hover:border-[#00d4ff] transition-all ml-auto"
          >
            info
          </button>
        )}
      </div>
      {expanded && children && <div>{children}</div>}
    </div>
  );
}

function HostNode({
  addr,
  conns,
  depth,
  expanded,
  onToggle,
  macVendor,
}: {
  addr: string;
  conns: Array<{
    remote_addr: string;
    remote_port: number;
    local_port: number;
    protocol: string;
    state: string;
    is_active: boolean;
    process_name?: string;
    deviceName: string;
  }>;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  macVendor?: string;
}) {
  const activeCount = conns.filter((c) => c.is_active).length;
  const inactiveCount = conns.length - activeCount;
  const protocols = [...new Set(conns.map((c) => c.protocol))];
  const isLoop = isLoopback(addr);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1 hover:bg-[#111827]/50 rounded transition-colors cursor-pointer"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={onToggle}
      >
        <span className="text-[10px] text-gray-600 font-mono w-3 flex-shrink-0">
          {expanded ? "▼" : "▶"}
        </span>
        <StatusIndicator active={activeCount > 0} size="sm" />
        <span
          className="text-xs font-mono truncate"
          style={{ color: isLoop ? "#9ca3af" : isPrivateIP(addr) ? "#ffd60a" : "#ff2d55" }}
        >
          {isLoop ? "127.0.0.1 (Loopback)" : addr}
        </span>
        <span className="text-[10px] font-mono text-gray-600">
          {protocols.join(",")}
        </span>
        {macVendor && (
          <span className="text-[9px] font-mono text-gray-500 truncate">{macVendor}</span>
        )}
        <div className="flex-1" />
        {activeCount > 0 && (
          <span className="text-[10px] font-mono text-[#00ff41]">{activeCount}●</span>
        )}
        {inactiveCount > 0 && (
          <span className="text-[10px] font-mono text-[#ff0040]">{inactiveCount}○</span>
        )}
      </div>

      {expanded && (
        <div className="space-y-0" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
          {conns.map((conn, ci) => {
            const dir = conn.local_port === conn.remote_port ? "⇄" : "→";
            return (
              <div
                key={ci}
                className="flex items-center gap-2 text-[10px] font-mono py-0.5 px-2 rounded bg-[#0a0e17]/50"
              >
                <StatusIndicator active={conn.is_active} size="sm" />
                <span className="text-gray-500">{conn.local_port}</span>
                <span className="text-gray-600">{dir}</span>
                <span className="text-gray-300">{conn.remote_port}</span>
                <span className="text-[#ffd60a]">{conn.protocol}</span>
                <span className="text-gray-600">{conn.state}</span>
                {conn.process_name && (
                  <span className="text-gray-600 truncate">({conn.process_name})</span>
                )}
                <span className="text-gray-700 ml-auto">{conn.deviceName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
