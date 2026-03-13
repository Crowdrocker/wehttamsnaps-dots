import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useToast } from "./hooks/useToast";
import { useTauri } from "./hooks/useTauri";
import InstancesTab   from "./pages/InstancesTab";
import GameFixesTab   from "./pages/GameFixesTab";
import NxmTab         from "./pages/NxmTab";
import ShortcutsTab   from "./pages/ShortcutsTab";
import ProtonTab      from "./pages/ProtonTab";
import SettingsTab    from "./pages/SettingsTab";

type Tab = "instances" | "gamefixes" | "nxm" | "shortcuts" | "proton" | "settings";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "instances",  label: "Instances",   icon: "⬡" },
  { id: "gamefixes",  label: "Game Fixes",  icon: "⚙" },
  { id: "nxm",        label: "NXM Handler", icon: "⬇" },
  { id: "shortcuts",  label: "Shortcuts",   icon: "⚡" },
  { id: "proton",     label: "Proton",      icon: "◈" },
  { id: "settings",   label: "Settings",    icon: "◎" },
];

export default function App() {
  const [tab, setTab]         = useState<Tab>("instances");
  const [soundMode, setSoundMode] = useState("jarvis");
  const { toasts, ok, err, info } = useToast();
  const { cmd } = useTauri();

  // Detect J.A.R.V.I.S. / iDroid mode on mount
  useEffect(() => {
    cmd<{ mode: string }>("get_sound_mode").then((r) => {
      if (r.ok && r.data) setSoundMode(r.data.mode);
    });
  }, []);

  const playSound = async (name: string) => {
    await cmd("play_jarvis_sound", { soundName: name, mode: soundMode });
  };

  // Window controls (frameless)
  const appWindow = getCurrentWindow();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--dark)" }}>

      {/* ── Titlebar ─────────────────────────────────────────────── */}
      <div
        data-tauri-drag-region
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          height: 40,
          background: "var(--mid)",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "var(--cyan)",
          }}>
            MO2 LINUX HELPER
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 10 }}>//</span>
          <span style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            color: "var(--text-muted)",
          }}>
            WehttamSnaps
          </span>
          <span
            className={`badge ${soundMode === "idroid" ? "badge-pink" : "badge-cyan"}`}
            style={{ marginLeft: 8 }}
          >
            {soundMode === "idroid" ? "⚔ iDroid" : "◎ J.A.R.V.I.S."}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => appWindow.minimize()}
            className="btn btn-icon btn-secondary"
            title="Minimise"
          >─</button>
          <button
            onClick={() => appWindow.toggleMaximize()}
            className="btn btn-icon btn-secondary"
            title="Maximise"
          >□</button>
          <button
            onClick={() => appWindow.close()}
            className="btn btn-icon btn-danger"
            title="Close"
          >✕</button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <nav style={{
          width: 180,
          background: "var(--mid)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "12px 0",
          flexShrink: 0,
        }}>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => { setTab(n.id); playSound("notification"); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: tab === n.id ? "var(--cyan-glow)" : "transparent",
                border: "none",
                borderLeft: `3px solid ${tab === n.id ? "var(--cyan)" : "transparent"}`,
                color: tab === n.id ? "var(--cyan)" : "var(--text-dim)",
                cursor: "pointer",
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textAlign: "left",
                width: "100%",
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: 16, opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          {/* Version footer */}
          <div style={{
            marginTop: "auto",
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            color: "var(--text-muted)",
          }}>
            v0.1.0-alpha<br />
            mo2-helper branch
          </div>
        </nav>

        {/* ── Main content ─────────────────────────────────────── */}
        <main style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          {tab === "instances"  && <InstancesTab  toast={{ ok, err, info }} playSound={playSound} />}
          {tab === "gamefixes"  && <GameFixesTab  toast={{ ok, err, info }} playSound={playSound} />}
          {tab === "nxm"        && <NxmTab        toast={{ ok, err, info }} playSound={playSound} />}
          {tab === "shortcuts"  && <ShortcutsTab  toast={{ ok, err, info }} playSound={playSound} />}
          {tab === "proton"     && <ProtonTab      toast={{ ok, err, info }} playSound={playSound} />}
          {tab === "settings"   && <SettingsTab   toast={{ ok, err, info }} playSound={playSound} />}
        </main>
      </div>

      {/* ── Toast container ──────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "◎"}</span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
