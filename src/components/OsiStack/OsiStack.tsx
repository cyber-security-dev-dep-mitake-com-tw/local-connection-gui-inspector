import { useTranslation } from "react-i18next";
import { StatusIndicator } from "../DeviceCard/StatusIndicator";
import type { DeviceInfo } from "../../lib/types";

interface OsiStackProps {
  devices: DeviceInfo[];
  onDeviceSelect?: (device: DeviceInfo) => void;
}

const LAYER_CONFIG = [
  { key: "layer7", color: "#ff2d55", labelKey: "osi.layer7", descKey: "osi.layer7_desc", icon: "◉" },
  { key: "layer6", color: "#ff375f", labelKey: "osi.layer6", descKey: "osi.layer6_desc", icon: "◎" },
  { key: "layer5", color: "#ff9500", labelKey: "osi.layer5", descKey: "osi.layer5_desc", icon: "◇" },
  { key: "layer4", color: "#ffd60a", labelKey: "osi.layer4", descKey: "osi.layer4_desc", icon: "◆" },
  { key: "layer3", color: "#bf5af2", labelKey: "osi.layer3", descKey: "osi.layer3_desc", icon: "▣" },
  { key: "layer2", color: "#00d4ff", labelKey: "osi.layer2", descKey: "osi.layer2_desc", icon: "▤" },
  { key: "layer1", color: "#00ff41", labelKey: "osi.layer1", descKey: "osi.layer1_desc", icon: "▥" },
];

export function OsiStack({ devices, onDeviceSelect }: OsiStackProps) {
  const { t } = useTranslation();

  const getDevicesAtLayer = (layerKey: string) => {
    return devices.filter((d) => {
      switch (layerKey) {
        case "layer1": return !!d.layer1;
        case "layer2": return !!d.layer2;
        case "layer3": return !!d.layer3;
        case "layer4": return !!d.layer4?.connections?.length;
        case "layer5": return !!d.layer5?.tls_sessions?.length;
        case "layer6": return !!d.layer6;
        case "layer7": return !!d.layer7?.length;
        default: return false;
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold font-mono text-[#00d4ff] glow-cyan">
          ◈ OSI Model
        </h2>
        <span className="text-xs font-mono text-gray-500">
          {devices.length} {devices.length === 1 ? "interface" : "interfaces"}
        </span>
      </div>

      <div className="space-y-1">
        {LAYER_CONFIG.map((layer) => {
          const layerDevices = getDevicesAtLayer(layer.key);
          const activeCount = layerDevices.filter((d) => d.is_active).length;

          return (
            <div
              key={layer.key}
              className="osi-layer card-cyber rounded-lg p-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="text-lg font-mono"
                    style={{ color: layer.color }}
                  >
                    {layer.icon}
                  </span>
                  <div>
                    <h3
                      className="text-sm font-bold font-mono"
                      style={{ color: layer.color }}
                    >
                      {t(layer.labelKey)}
                    </h3>
                    <p className="text-xs text-gray-500">{t(layer.descKey)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {layerDevices.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {activeCount > 0 && (
                        <div className="flex items-center gap-1">
                          <StatusIndicator active={true} size="sm" />
                          <span className="text-xs text-[#00ff41] font-mono">
                            {activeCount}
                          </span>
                        </div>
                      )}
                      {layerDevices.length - activeCount > 0 && (
                        <div className="flex items-center gap-1">
                          <StatusIndicator active={false} size="sm" />
                          <span className="text-xs text-[#ff0040] font-mono">
                            {layerDevices.length - activeCount}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="text-xs text-gray-600 font-mono">
                    {layerDevices.length} devices
                  </span>
                </div>
              </div>

              {layerDevices.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#1e3a5f]/50 flex flex-wrap gap-1.5">
                  {layerDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => onDeviceSelect?.(device)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#0a0e17] border border-[#1e3a5f]/50 hover:border-[#2d6a9f] transition-colors text-xs font-mono"
                    >
                      <StatusIndicator active={device.is_active} size="sm" />
                      <span className="text-gray-300">{device.name}</span>
                      {layer.key === "layer3" && device.layer3?.ipv4_addresses[0] && (
                        <span className="text-[#00ff41]">
                          {device.layer3.ipv4_addresses[0]}
                        </span>
                      )}
                      {layer.key === "layer7" && device.layer7?.[0] && (
                        <span style={{ color: LAYER_CONFIG[0].color }}>
                          {device.layer7[0].protocol}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
