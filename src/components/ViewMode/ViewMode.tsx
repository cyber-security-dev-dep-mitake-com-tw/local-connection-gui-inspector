import { useTranslation } from "react-i18next";
import type { ViewMode } from "../../lib/types";

interface ViewModeProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeProps) {
  const { t } = useTranslation();

  const modes: { id: ViewMode; label: string; icon: string }[] = [
    { id: "cards", label: t("settings.cards"), icon: "▦" },
    { id: "table", label: t("settings.table"), icon: "▤" },
    { id: "modal", label: t("settings.modal"), icon: "◰" },
  ];

  return (
    <div className="flex items-center gap-1 bg-[#0a0e17] rounded-lg p-1 border border-[#1e3a5f]">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
            mode === m.id
              ? "bg-[#1e3a5f] text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.15)]"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className="mr-1">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}
