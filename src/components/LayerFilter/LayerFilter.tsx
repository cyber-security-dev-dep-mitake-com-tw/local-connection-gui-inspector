import { useTranslation } from "react-i18next";
import type { LayerKey } from "../../lib/types";
import { ALL_LAYERS } from "../../lib/types";

interface LayerFilterProps {
  activeLayers: LayerKey[];
  onChange: (layers: LayerKey[]) => void;
}

const LAYER_COLORS: Record<LayerKey, string> = {
  layer1: "#00ff41",
  layer2: "#00d4ff",
  layer3: "#bf5af2",
  layer4: "#ffd60a",
  layer5: "#ff9500",
  layer6: "#ff375f",
  layer7: "#ff2d55",
};

const LAYER_LABELS: Record<LayerKey, string> = {
  layer1: "L1",
  layer2: "L2",
  layer3: "L3",
  layer4: "L4",
  layer5: "L5",
  layer6: "L6",
  layer7: "L7",
};

export function LayerFilter({ activeLayers, onChange }: LayerFilterProps) {
  const { t } = useTranslation();

  const allActive = activeLayers.length === ALL_LAYERS.length;

  const toggleAll = () => {
    if (allActive) {
      onChange([]);
    } else {
      onChange([...ALL_LAYERS]);
    }
  };

  const toggleLayer = (layer: LayerKey) => {
    if (activeLayers.includes(layer)) {
      onChange(activeLayers.filter((l) => l !== layer));
    } else {
      onChange([...activeLayers, layer]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-mono mr-1">
        {t("settings.filter_layers")}:
      </span>
      <button
        onClick={toggleAll}
        className={`px-2 py-1 rounded text-[10px] font-mono transition-all border ${
          allActive
            ? "bg-[#1e3a5f] border-[#2d6a9f] text-[#00d4ff]"
            : "border-[#1e3a5f] text-gray-500 hover:text-gray-300"
        }`}
      >
        {t("settings.all_layers")}
      </button>
      {ALL_LAYERS.map((layer) => {
        const isActive = activeLayers.includes(layer);
        return (
          <button
            key={layer}
            onClick={() => toggleLayer(layer)}
            className={`w-8 h-8 rounded-md text-[10px] font-bold font-mono transition-all border ${
              isActive
                ? "border-current"
                : "border-[#1e3a5f] opacity-30 hover:opacity-60"
            }`}
            style={{
              color: isActive ? LAYER_COLORS[layer] : "#6b7280",
              backgroundColor: isActive ? `${LAYER_COLORS[layer]}15` : "transparent",
              borderColor: isActive ? LAYER_COLORS[layer] : undefined,
            }}
            title={t(`osi.${layer}`)}
          >
            {LAYER_LABELS[layer]}
          </button>
        );
      })}
    </div>
  );
}
