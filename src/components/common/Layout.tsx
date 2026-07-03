import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { t, i18n } = useTranslation();

  const tabs = [
    { id: "dashboard", label: t("nav.dashboard"), icon: "◈" },
    { id: "tools", label: t("nav.tools"), icon: "⚙" },
    { id: "settings", label: t("nav.settings"), icon: "☰" },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "zh-TW" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex h-screen bg-[#0a0e17]">
      <aside className="w-56 flex-shrink-0 bg-[#0a0e17] border-r border-[#1e3a5f] flex flex-col">
        <div className="p-4 border-b border-[#1e3a5f]">
          <h1 className="text-lg font-bold text-[#00d4ff] glow-cyan font-mono">
            ◈ {t("app.title")}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {t("app.subtitle")}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg font-mono text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-[#1e3a5f] text-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                  : "text-gray-400 hover:bg-[#111827] hover:text-gray-200"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1e3a5f]">
          <button
            onClick={toggleLanguage}
            className="w-full px-3 py-2 rounded-lg text-sm font-mono text-gray-400 hover:bg-[#111827] hover:text-gray-200 transition-all"
          >
            {i18n.language === "en" ? "繁體中文" : "English"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
