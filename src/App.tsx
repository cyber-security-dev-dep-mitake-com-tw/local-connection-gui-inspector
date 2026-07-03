import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDevices } from "./hooks/useDevices";
import { Layout } from "./components/common/Layout";
import { OsiStack } from "./components/OsiStack/OsiStack";
import { DeviceCard } from "./components/DeviceCard/DeviceCard";
import { ConnectionChain } from "./components/ConnectionChain/ConnectionChain";
import { ViewModeToggle } from "./components/ViewMode/ViewMode";
import { PingTool } from "./components/Tools/PingTool";
import { TracerouteTool } from "./components/Tools/TracerouteTool";
import { PortScanTool } from "./components/Tools/PortScanTool";
import { PacketCaptureTool } from "./components/Tools/PacketCapture";
import { Settings } from "./components/Settings/Settings";
import { StatusIndicator } from "./components/DeviceCard/StatusIndicator";
import type { DeviceInfo, ViewMode } from "./lib/types";

export default function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [showModal, setShowModal] = useState(false);

  const { snapshot, loading, error, autoRefresh, setAutoRefresh, refresh } =
    useDevices(refreshInterval * 1000);

  const devices = snapshot?.devices ?? [];

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
                    label="Interfaces"
                    value={String(devices.length)}
                    color="#00d4ff"
                  />
                  <StatCard
                    label="Active"
                    value={String(devices.filter((d) => d.is_active).length)}
                    color="#00ff41"
                  />
                  <StatCard
                    label="Connections"
                    value={String(
                      devices.reduce((acc, d) => acc + d.connections.length, 0)
                    )}
                    color="#ffd60a"
                  />
                  <StatCard
                    label="Protocols"
                    value={String(
                      new Set(
                        devices
                          .flatMap((d) => d.layer7 ?? [])
                          .map((l) => l.protocol)
                      ).size
                    )}
                    color="#bf5af2"
                  />
                </div>

                {/* OSI Stack */}
                <OsiStack
                  devices={devices}
                  onDeviceSelect={handleDeviceSelect}
                />

                {/* Connection Chain */}
                {selectedDevice && viewMode !== "modal" && (
                  <ConnectionChain
                    device={selectedDevice}
                    allDevices={devices}
                  />
                )}

                {/* Device List */}
                {viewMode === "cards" && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold font-mono text-gray-400">
                      {t("device.name")}s
                    </h3>
                    <div className="space-y-2">
                      {devices.map((device) => (
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
                        {devices.map((device) => (
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
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card-cyber rounded-lg p-3">
      <p className="text-xs text-gray-500 font-mono">{label}</p>
      <p className="text-xl font-bold font-mono" style={{ color }}>
        {value}
      </p>
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
