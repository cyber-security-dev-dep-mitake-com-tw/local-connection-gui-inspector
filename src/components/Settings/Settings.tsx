import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useElevation } from "../../hooks/useElevation";
import type { ViewMode } from "../../lib/types";

interface SettingsProps {
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  refreshInterval: number;
  onRefreshIntervalChange: (value: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function Settings({
  autoRefresh,
  onAutoRefreshChange,
  refreshInterval,
  onRefreshIntervalChange,
  viewMode,
  onViewModeChange,
}: SettingsProps) {
  const { t, i18n } = useTranslation();
  const { status: elevationStatus, request } = useElevation();
  const [elevating, setElevating] = useState(false);

  const handleElevation = async () => {
    setElevating(true);
    try {
      await request();
    } finally {
      setElevating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold font-mono text-[#00d4ff] glow-cyan">
        ☰ {t("settings.title")}
      </h2>

      {/* Language */}
      <SettingsSection title={t("settings.language")} icon="🌐">
        <div className="flex gap-2">
          <button
            onClick={() => i18n.changeLanguage("en")}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
              i18n.language === "en"
                ? "bg-[#1e3a5f] text-[#00d4ff]"
                : "text-gray-400 hover:bg-[#111827]"
            }`}
          >
            English
          </button>
          <button
            onClick={() => i18n.changeLanguage("zh-TW")}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
              i18n.language === "zh-TW"
                ? "bg-[#1e3a5f] text-[#00d4ff]"
                : "text-gray-400 hover:bg-[#111827]"
            }`}
          >
            繁體中文
          </button>
        </div>
      </SettingsSection>

      {/* View Mode */}
      <SettingsSection title={t("settings.view_mode")} icon="◰">
        <div className="flex gap-2">
          {(["cards", "table", "tree", "modal"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                viewMode === mode
                  ? "bg-[#1e3a5f] text-[#00d4ff]"
                  : "text-gray-400 hover:bg-[#111827]"
              }`}
            >
              {t(`settings.${mode}`)}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Auto Refresh */}
      <SettingsSection title={t("settings.auto_refresh")} icon="⟳">
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
              className="w-4 h-4 accent-[#00d4ff]"
            />
            <span className="text-sm text-gray-300 font-mono">
              {t("settings.auto_refresh")}
            </span>
          </label>

          {autoRefresh && (
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500 font-mono">
                {t("settings.refresh_interval")}:
              </label>
              <input
                type="range"
                min={1}
                max={30}
                value={refreshInterval}
                onChange={(e) => onRefreshIntervalChange(Number(e.target.value))}
                className="flex-1 accent-[#00d4ff]"
              />
              <span className="text-sm font-mono text-[#00d4ff] w-16 text-right">
                {refreshInterval} {t("settings.seconds")}
              </span>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Elevation */}
      <SettingsSection title={t("settings.elevation")} icon="🔑">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono ${
                elevationStatus?.is_elevated
                  ? "bg-[#00ff40]/10 text-[#00ff40] border border-[#00ff40]/30"
                  : "bg-[#ff0040]/10 text-[#ff0040] border border-[#ff0040]/30"
              }`}
            >
              {elevationStatus?.is_elevated
                ? t("settings.elevated")
                : t("settings.not_elevated")}
            </span>
          </div>

          {elevationStatus && (
            <p className="text-xs text-gray-500 font-mono">
              {elevationStatus.message}
            </p>
          )}

          {!elevationStatus?.is_elevated && (
            <button
              onClick={handleElevation}
              disabled={elevating}
              className="btn-cyber px-4 py-2 rounded-lg text-sm font-mono disabled:opacity-50"
            >
              {elevating ? t("common.loading") : t("settings.request_elevation")}
            </button>
          )}
        </div>
      </SettingsSection>

      {/* About */}
      <SettingsSection title={t("settings.about")} icon="ℹ">
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("settings.version")}</span>
            <span className="text-gray-300">0.1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Platform</span>
            <span className="text-gray-300">{elevationStatus?.platform ?? "Unknown"}</span>
          </div>
          <p className="text-gray-500 text-xs mt-2">{t("settings.description")}</p>
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-cyber rounded-xl p-4">
      <h3 className="text-sm font-bold font-mono text-[#00d4ff] mb-3">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
