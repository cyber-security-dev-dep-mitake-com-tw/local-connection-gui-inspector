import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDevices } from "./hooks/useDevices";
import { Layout } from "./components/common/Layout";
import { OsiStack } from "./components/OsiStack/OsiStack";
import { DeviceCard } from "./components/DeviceCard/DeviceCard";
import { ConnectionChain } from "./components/ConnectionChain/ConnectionChain";
import { ViewModeToggle } from "./components/ViewMode/ViewMode";
import { TreeView } from "./components/TreeView/TreeView";
import { LayerFilter } from "./components/LayerFilter/LayerFilter";
import { PingTool } from "./components/Tools/PingTool";
import { TracerouteTool } from "./components/Tools/TracerouteTool";
import { PortScanTool } from "./components/Tools/PortScanTool";
import { PacketCaptureTool } from "./components/Tools/PacketCapture";
import { Settings } from "./components/Settings/Settings";
import { StatusIndicator } from "./components/DeviceCard/StatusIndicator";
import { ALL_LAYERS } from "./lib/types";
import type { DeviceInfo, ViewMode, LayerKey } from "./lib/types";

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [activeLayers, setActiveLayers] = useState<LayerKey[]>([...ALL_LAYERS]);

  const { snapshot, loading, error, autoRefresh, setAutoRefresh, refresh } =
    useDevices(refreshInterval * 1000);

  const devices = snapshot?.devices ?? [];

  const filteredDevices = useMemo(() => {
    if (activeLayers.length === ALL_LAYERS.length) return devices;
    return devices.filter((d) => {
      if (activeLayers.includes("layer1") && d.layer1) return true;
      if (activeLayers.includes("layer2") && d.layer2) return true;
      if (activeLayers.includes("layer3") && d.layer3) return true;
      if (activeLayers.includes("layer4") && d.layer4?.connections?.length) return true;
      if (activeLayers.includes("layer5") && d.layer5?.tls_sessions?.length) return true;
      if (activeLayers.includes("layer6") && d.layer6) return true;
      if (activeLayers.includes("layer7") && d.layer7?.length) return true;
      return false;
    });
  }, [devices, activeLayers]);

  const handleDeviceSelect = (device: DeviceInfo) => {
    setSelectedDevice(device);
    if (viewMode === "modal") {
      setShowModal(true);
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Header Bar */}
      <div className="sticky top-0 z-10 bg-[#0a0e17]/90 backdrop-blur-sm border-b border-[#1e3a5f] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold font-mono text-[#00d4ff] glow-cyan">
              {activeTab === "dashboard" && "◈ " + t("nav.dashboard")}
              {activeTab === "tools" && "⚙ " + t("nav.tools")}
              {activeTab === "settings" && "☰ " + t("nav.settings")}
            </h1>
            {activeTab === "dashboard" && snapshot && (
              <span className="text-xs font-mono text-gray-500">
                {snapshot.timestamp}
              </span>
            )}
          </div>

          {activeTab === "dashboard" && (
            <div className="flex items-center gap-3">
              <LayerFilter activeLayers={activeLayers} onChange={setActiveLayers} />
              <div className="w-px h-6 bg-[#1e3a5f]" />
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
              <button
                onClick={refresh}
                className="btn-cyber px-3 py-1.5 rounded-lg text-xs font-mono"
              >
                ⟳ {t("common.refresh")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-[#00d4ff] font-mono animate-pulse">
                  {t("common.loading")}
                </div>
              </div>
            )}

            {error && (
              <div className="card-cyber rounded-lg p-4 border-[#ff0040]/50">
                <p className="text-sm font-mono text-[#ff0040]">
                  {t("common.error")}: {error}
                </p>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-3">
                  <StatCard
                    label={t("stats.interfaces")}
                    value={String(filteredDevices.length)}
                    color="#00d4ff"
                    items={filteredDevices.map((d) => `${d.name} — ${d.layer3?.ipv4_addresses[0] ?? "N/A"}`)}
                  />
                  <StatCard
                    label={t("stats.active")}
                    value={String(filteredDevices.filter((d) => d.is_active).length)}
                    color="#00ff41"
                    items={filteredDevices
                      .filter((d) => d.is_active)
                      .map((d) => `${d.name} — ${d.layer3?.ipv4_addresses[0] ?? "N/A"}`)}
                  />
                  <StatCard
                    label={t("stats.connections")}
                    value={String(
                      filteredDevices.reduce((acc, d) => acc + d.connections.length, 0)
                    )}
                    color="#ffd60a"
                    items={filteredDevices
                      .flatMap((d) =>
                        d.connections.map((c) => ({
                          iface: d.name,
                          conn: c,
                        }))
                      )
                      .slice(0, 50)
                      .map((x) => `${x.conn.remote_addr}:${x.conn.remote_port}`)}
                  />
                  <StatCard
                    label={t("stats.protocols")}
                    value={String(
                      new Set(
                        filteredDevices
                          .flatMap((d) => d.layer7 ?? [])
                          .map((l) => l.protocol)
                      ).size
                    )}
                    color="#bf5af2"
                    items={[
                      ...new Set(
                        filteredDevices
                          .flatMap((d) => d.layer7 ?? [])
                          .map((l) => `${l.protocol} — ${l.service}`)
                      ),
                    ]}
                  />
                </div>

                {/* Tree View Mode */}
                {viewMode === "tree" && (
                  <>
                    <TreeView
                      devices={filteredDevices}
                      lanDevices={snapshot?.lan_devices ?? []}
                      activeLayers={activeLayers}
                      onDeviceSelect={handleDeviceSelect}
                    />
                    {selectedDevice && (
                      <ConnectionChain
                        device={selectedDevice}
                        allDevices={filteredDevices}
                      />
                    )}
                  </>
                )}

                {/* Non-tree modes */}
                {viewMode !== "tree" && (
                  <>
                    {/* OSI Stack */}
                    <OsiStack
                      devices={filteredDevices}
                      onDeviceSelect={handleDeviceSelect}
                    />

                    {/* Connection Chain */}
                    {selectedDevice && viewMode !== "modal" && (
                      <ConnectionChain
                        device={selectedDevice}
                        allDevices={filteredDevices}
                      />
                    )}

                    {/* Device List - Cards */}
                    {viewMode === "cards" && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-bold font-mono text-gray-400">
                          {t("device.name")}s
                        </h3>
                        <div className="space-y-2">
                          {filteredDevices.map((device) => (
                            <DeviceCard
                              key={device.id}
                              device={device}
                              viewMode="cards"
                              onSelect={handleDeviceSelect}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Device List - Table */}
                    {viewMode === "table" && (
                      <div className="card-cyber rounded-xl overflow-hidden">
                        <table className="table-cyber w-full">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left">{t("device.name")}</th>
                              <th className="px-4 py-3 text-left">{t("device.mac")}</th>
                              <th className="px-4 py-3 text-left">{t("device.ip")}</th>
                              <th className="px-4 py-3 text-left">{t("device.vendor")}</th>
                              <th className="px-4 py-3 text-left">{t("device.connections")}</th>
                              <th className="px-4 py-3 text-left">{t("device.protocol")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDevices.map((device) => (
                              <DeviceCard
                                key={device.id}
                                device={device}
                                viewMode="table"
                                onSelect={handleDeviceSelect}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Tools */}
        {activeTab === "tools" && (
          <div className="space-y-6">
            <ToolsSection title={t("tools.ping")} description={t("tools.ping_desc")} icon="◉">
              <PingTool />
            </ToolsSection>

            <ToolsSection title={t("tools.traceroute")} description={t("tools.traceroute_desc")} icon="◎">
              <TracerouteTool />
            </ToolsSection>

            <ToolsSection title={t("tools.port_scan")} description={t("tools.port_scan_desc")} icon="◇">
              <PortScanTool />
            </ToolsSection>

            <ToolsSection title={t("tools.packet_capture")} description={t("tools.packet_capture_desc")} icon="▣">
              <PacketCaptureTool />
            </ToolsSection>
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <Settings
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={setRefreshInterval}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}
      </div>

      {/* Device Modal */}
      {showModal && selectedDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card-cyber rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <StatusIndicator active={selectedDevice.is_active} />
                <h2 className="text-lg font-bold font-mono text-[#00d4ff]">
                  {selectedDevice.display_name}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedDevice.layer1 && (
                <ModalSection title={t("osi.layer1")} color="#00ff41">
                  <ModalRow label={t("device.type")} value={selectedDevice.layer1.interface_type} />
                  <ModalRow label={t("device.mac")} value={selectedDevice.layer1.mac_address} />
                  <ModalRow label={t("device.vendor")} value={selectedDevice.layer1.vendor} />
                  <ModalRow label={t("device.mtu")} value={`${selectedDevice.layer1.mtu} ${t("device.mtu_unit")}`} />
                </ModalSection>
              )}

              {selectedDevice.layer3 && (
                <ModalSection title={t("osi.layer3")} color="#bf5af2">
                  {selectedDevice.layer3.ipv4_addresses.map((ip, i) => (
                    <ModalRow key={i} label="IPv4" value={ip} />
                  ))}
                  {selectedDevice.layer3.default_gateway && (
                    <ModalRow label={t("device.gateway")} value={selectedDevice.layer3.default_gateway} />
                  )}
                </ModalSection>
              )}

              {selectedDevice.layer7 && selectedDevice.layer7.length > 0 && (
                <ModalSection title={t("osi.layer7")} color="#ff2d55">
                  {selectedDevice.layer7.map((l7, i) => (
                    <ModalRow key={i} label={l7.protocol} value={`${l7.service} ${l7.details ?? ""}`} />
                  ))}
                </ModalSection>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function StatCard({
  label,
  value,
  color,
  items,
  renderItem,
}: {
  label: string;
  value: string;
  color: string;
  items?: string[];
  renderItem?: (item: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left card-cyber rounded-lg p-3 hover:border-[color:var(--hover)] transition-colors cursor-pointer"
        style={{ ["--hover" as string]: color }}
      >
        <p className="text-xs text-gray-500 font-mono">{label}</p>
        <p className="text-xl font-bold font-mono" style={{ color }}>
          {value}
        </p>
      </button>

      {open && items && items.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto card-cyber rounded-lg border border-[#1e3a5f] shadow-lg">
          <div className="p-2 space-y-1">
            {items.map((item, i) => (
              <div
                key={i}
                className="text-[10px] font-mono text-gray-400 px-2 py-1 rounded hover:bg-[#111827]/60 truncate"
              >
                {renderItem ? renderItem(item) : item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-cyber rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl text-[#00d4ff]">{icon}</span>
        <div>
          <h3 className="text-sm font-bold font-mono text-[#00d4ff]">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ModalSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#1e3a5f]/50 rounded-lg p-3">
      <h4 className="text-xs font-bold font-mono mb-2" style={{ color }}>
        [{title}]
      </h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="text-gray-500 w-24">{label}:</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
