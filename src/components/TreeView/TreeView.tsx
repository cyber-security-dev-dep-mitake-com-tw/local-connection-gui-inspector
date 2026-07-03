import { useTranslation } from "react-i18next";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { DeviceInfo, LayerKey } from "../../lib/types";

interface TreeViewProps {
  devices: DeviceInfo[];
  activeLayers: LayerKey[];
  onDeviceSelect?: (device: DeviceInfo) => void;
}

interface TreeNode {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  isActive: boolean;
  children: TreeNode[];
  device?: DeviceInfo;
}

export function TreeView({ devices, activeLayers, onDeviceSelect }: TreeViewProps) {
  const { t } = useTranslation();

  const tree = buildTree(devices, activeLayers);

  return (
    <div className="card-cyber rounded-xl p-5 overflow-x-auto">
      <h2 className="text-sm font-bold font-mono text-[#00d4ff] mb-4">
        ⌥ {t("settings.tree")}
      </h2>

      {tree.length === 0 ? (
        <p className="text-xs text-gray-500 font-mono text-center py-8">
          {t("common.no_data")}
        </p>
      ) : (
        <div className="flex gap-8 items-start min-w-max pb-4">
          {tree.map((rootNode) => (
            <div key={rootNode.id} className="flex items-start">
              {/* Root node (local device) */}
              <div className="flex flex-col items-center">
                <NodeCard
                  node={rootNode}
                  onClick={() => rootNode.device && onDeviceSelect?.(rootNode.device)}
                />
              </div>

              {/* Children (gateways / remote hosts) */}
              {rootNode.children.length > 0 && (
                <div className="flex items-start">
                  {/* Horizontal line from root */}
                  <div className="flex items-center pt-6">
                    <div className="w-8 h-px bg-[#1e3a5f]" />
                    <div className="text-[#1e3a5f] text-xs">▸</div>
                    <div className="w-8 h-px bg-[#1e3a5f]" />
                  </div>

                  {/* Child nodes */}
                  <div className="flex flex-col gap-3">
                    {rootNode.children.map((child) => (
                      <div key={child.id} className="flex items-start">
                        {/* Vertical connector */}
                        <div className="flex flex-col items-center">
                          <div className="w-px h-3 bg-[#1e3a5f]" />
                          <NodeCard
                            node={child}
                            onClick={() => child.device && onDeviceSelect?.(child.device)}
                          />
                        </div>

                        {/* Grandchildren (remote hosts) */}
                        {child.children.length > 0 && (
                          <div className="flex items-start">
                            <div className="flex items-center pt-6">
                              <div className="w-6 h-px bg-[#1e3a5f]" />
                              <div className="text-[#1e3a5f] text-xs">▸</div>
                              <div className="w-6 h-px bg-[#1e3a5f]" />
                            </div>
                            <div className="flex flex-col gap-2">
                              {child.children.map((grandchild) => (
                                <div key={grandchild.id} className="flex items-start">
                                  <div className="w-px h-3 bg-[#1e3a5f] mr-0" />
                                  <NodeCard
                                    node={grandchild}
                                    compact
                                    onClick={() => grandchild.device && onDeviceSelect?.(grandchild.device)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NodeCard({
  node,
  compact,
  onClick,
}: {
  node: TreeNode;
  compact?: boolean;
  onClick?: () => void;
}) {
  const sizeClass = compact ? "min-w-[110px] p-2" : "min-w-[140px] p-3";

  return (
    <button
      onClick={onClick}
      className={`card-cyber rounded-lg ${sizeClass} text-center cursor-pointer hover:border-[#2d6a9f] transition-all group`}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <StatusIndicator active={node.isActive} size="sm" />
        <span className="text-xs font-mono truncate" style={{ color: node.color }}>
          {node.label}
        </span>
      </div>
      <p className="text-[10px] font-mono text-gray-500 truncate">{node.sublabel}</p>
      {node.children.length > 0 && (
        <p className="text-[10px] font-mono text-gray-600 mt-1">
          {node.children.length} downstream
        </p>
      )}
    </button>
  );
}

function buildTree(devices: DeviceInfo[], _activeLayers: LayerKey[]): TreeNode[] {
  const roots: TreeNode[] = [];

  for (const device of devices) {
    const remoteHosts = Array.from(
      new Set(
        device.connections
          .map((c) => c.remote_addr)
          .filter((a) => a !== "0.0.0.0" && a !== "127.0.0.1")
      )
    );

    const gateway = device.layer3?.default_gateway;

    const gatewayChildren: TreeNode[] = [];

    if (gateway) {
      const gwConnections = device.connections.filter(
        (c) => c.remote_addr === gateway
      );
      gatewayChildren.push({
        id: `gw-${device.id}`,
        label: gateway,
        sublabel: "Gateway",
        color: "#bf5af2",
        isActive: gwConnections.length > 0,
        children: [],
        device: undefined,
      });
    }

    const remoteChildren: TreeNode[] = remoteHosts
      .filter((h) => h !== gateway)
      .slice(0, 15)
      .map((host) => {
        const hostConns = device.connections.filter(
          (c) => c.remote_addr === host
        );
        const protocols = [...new Set(hostConns.map((c) => c.protocol))];
        return {
          id: `remote-${device.id}-${host}`,
          label: host,
          sublabel: protocols.join(", ") || "Unknown",
          color: "#ffd60a",
          isActive: hostConns.some((c) => c.is_active),
          children: [],
          device: undefined,
        };
      });

    const allChildren = [...gatewayChildren, ...remoteChildren];

    const ip = device.layer3?.ipv4_addresses[0] ?? "N/A";

    roots.push({
      id: device.id,
      label: device.name,
      sublabel: ip,
      color: "#00ff41",
      isActive: device.is_active,
      children: allChildren,
      device,
    });
  }

  return roots;
}
