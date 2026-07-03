import { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusIndicator } from "./StatusIndicator";
import type { DeviceInfo } from "../../lib/types";

interface DeviceCardProps {
  device: DeviceInfo;
  viewMode: "cards" | "table" | "modal";
  onSelect?: (device: DeviceInfo) => void;
}

export function DeviceCard({ device, viewMode, onSelect }: DeviceCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (viewMode === "table") {
    return <TableRow device={device} onSelect={onSelect} />;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
    onSelect?.(device);
  };

  return (
    <div
      className={`card-cyber rounded-xl p-4 cursor-pointer transition-all duration-300 ${
        expanded ? "ring-1 ring-[#00d4ff]/30" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <StatusIndicator active={device.is_active} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#00d4ff] font-mono truncate">
            {device.display_name}
          </h3>
          {device.layer1 && (
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {device.layer1.mac_address}
            </p>
          )}
        </div>
        {device.layer3 && device.layer3.ipv4_addresses[0] && (
          <span className="text-xs text-[#00ff41] glow-green font-mono">
            {device.layer3.ipv4_addresses[0]}
          </span>
        )}
        <span className="text-gray-600 text-xs">
          {expanded ? "▼" : "▶"}
        </span>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#1e3a5f] space-y-3">
          {device.layer1 && (
            <LayerSection title={t("osi.layer1")} color="#00ff41">
              <InfoRow label={t("device.type")} value={device.layer1.interface_type} />
              <InfoRow label={t("device.mac")} value={device.layer1.mac_address} />
              <InfoRow label={t("device.vendor")} value={device.layer1.vendor} />
              <InfoRow label={t("device.mtu")} value={`${device.layer1.mtu} ${t("device.mtu_unit")}`} />
              {device.layer1.speed && (
                <InfoRow label={t("device.speed")} value={`${device.layer1.speed} Mbps`} />
              )}
              <InfoRow label={t("device.is_up")} value={device.layer1.is_up ? t("device.up") : t("device.down")} />
            </LayerSection>
          )}

          {device.layer2 && (
            <LayerSection title={t("osi.layer2")} color="#00d4ff">
              <InfoRow label={t("device.mac")} value={device.layer2.mac_address} />
              <InfoRow label={t("device.vendor")} value={device.layer2.vendor} />
              {device.layer2.vlan_id && (
                <InfoRow label="VLAN" value={String(device.layer2.vlan_id)} />
              )}
              {device.layer2.arp_entries.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">{t("device.arp_entries")}:</p>
                  {device.layer2.arp_entries.slice(0, 5).map((entry, i) => (
                    <p key={i} className="text-xs text-gray-500 font-mono pl-2">
                      {entry.ip} → {entry.mac} ({entry.vendor})
                    </p>
                  ))}
                </div>
              )}
            </LayerSection>
          )}

          {device.layer3 && (
            <LayerSection title={t("osi.layer3")} color="#bf5af2">
              {device.layer3.ipv4_addresses.map((ip, i) => (
                <InfoRow key={i} label="IPv4" value={ip} />
              ))}
              {device.layer3.ipv6_addresses.map((ip, i) => (
                <InfoRow key={i} label="IPv6" value={ip} />
              ))}
              {device.layer3.subnet_mask && (
                <InfoRow label={t("device.subnet")} value={device.layer3.subnet_mask} />
              )}
              {device.layer3.default_gateway && (
                <InfoRow label={t("device.gateway")} value={device.layer3.default_gateway} />
              )}
              {device.layer3.dns_servers.length > 0 && (
                <InfoRow label={t("device.dns")} value={device.layer3.dns_servers.join(", ")} />
              )}
            </LayerSection>
          )}

          {device.layer4 && device.layer4.connections.length > 0 && (
            <LayerSection title={t("osi.layer4")} color="#ffd60a">
              <p className="text-xs text-gray-400 mb-2">
                {device.layer4.connections.length} {t("device.connections").toLowerCase()}
              </p>
              {device.layer4.connections.slice(0, 15).map((conn, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono py-0.5">
                  <StatusIndicator active={conn.is_active} size="sm" />
                  <span className="text-gray-400">
                    {conn.local_addr}:{conn.local_port}
                  </span>
                  <span className="text-gray-600">→</span>
                  <span className="text-gray-300">
                    {conn.remote_addr}:{conn.remote_port}
                  </span>
                  <span className="text-[#ffd60a]">{conn.protocol}</span>
                  {conn.process_name && (
                    <span className="text-gray-500">({conn.process_name})</span>
                  )}
                </div>
              ))}
              {device.layer4.connections.length > 15 && (
                <p className="text-[10px] text-gray-600 font-mono mt-1">
                  +{device.layer4.connections.length - 15} more...
                </p>
              )}
            </LayerSection>
          )}

          {device.layer5 && device.layer5.tls_sessions.length > 0 && (
            <LayerSection title={t("osi.layer5")} color="#ff9500">
              {device.layer5.tls_sessions.map((tls, i) => (
                <div key={i} className="text-xs font-mono py-0.5">
                  <span className="text-gray-300">
                    {tls.remote_addr}:{tls.remote_port}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {tls.version} ({tls.cipher})
                  </span>
                </div>
              ))}
            </LayerSection>
          )}

          {device.layer6 && (
            <LayerSection title={t("osi.layer6")} color="#ff375f">
              <InfoRow label={t("device.encoding")} value={device.layer6.encoding} />
              {device.layer6.cipher_suite && (
                <InfoRow label={t("device.cipher")} value={device.layer6.cipher_suite} />
              )}
            </LayerSection>
          )}

          {device.layer7 && device.layer7.length > 0 && (
            <LayerSection title={t("osi.layer7")} color="#ff2d55">
              {device.layer7.map((l7, i) => (
                <div key={i} className="text-xs font-mono py-0.5">
                  <span className="text-[#ff2d55]">{l7.protocol}</span>
                  <span className="text-gray-400 ml-2">{l7.service}</span>
                  {l7.details && (
                    <span className="text-gray-500 ml-2">({l7.details})</span>
                  )}
                </div>
              ))}
            </LayerSection>
          )}
        </div>
      )}
    </div>
  );
}

function TableRow({
  device,
  onSelect,
}: {
  device: DeviceInfo;
  onSelect?: (device: DeviceInfo) => void;
}) {
  return (
    <tr
      className="cursor-pointer hover:bg-[#111827] transition-colors"
      onClick={() => onSelect?.(device)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusIndicator active={device.is_active} size="sm" />
          <span className="text-sm font-mono text-[#00d4ff]">
            {device.display_name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-mono text-gray-400">
        {device.layer1?.mac_address ?? "N/A"}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-gray-400">
        {device.layer3?.ipv4_addresses[0] ?? "N/A"}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-gray-400">
        {device.layer1?.vendor ?? "N/A"}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-[#00ff41]">
        {device.connections.length}
      </td>
      <td className="px-4 py-3 text-sm font-mono text-gray-400">
        {device.layer7?.map((l) => l.protocol).join(", ") ?? "N/A"}
      </td>
    </tr>
  );
}

function LayerSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold font-mono mb-2" style={{ color }}>
        [{title}]
      </h4>
      <div className="pl-2 space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-gray-500 w-28 flex-shrink-0">{label}:</span>
      <span className="text-gray-300 break-all">{value}</span>
    </div>
  );
}
