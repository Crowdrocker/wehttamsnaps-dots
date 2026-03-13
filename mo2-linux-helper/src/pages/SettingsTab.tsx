import { useState, useEffect } from "react";
import { useTauri } from "../hooks/useTauri";

interface Config {
  mo2_exe: string;
  proton_path: string;
  wine_prefix: string;
  steam_path: string;
  instances_dir: string;
  sounds_enabled: boolean;
  sound_mode: string;
  nxm_handler_registered: boolean;
}

interface Props {
  toast: { ok(m: string): void; err(m: string): void; info(m: string): void };
  playSound(name: string): void;
}

const JARVIS_SOUNDS = [
  "startup", "shutdown", "notification", "audio-mute", "audio-unmute",
  "volume-up", "volume-down", "screenshot", "gamemode-on", "gamemode-off",
  "steam-launch", "photo-export", "workspace-switch", "window-close",
];

export default function SettingsTab({ toast, playSound }: Props) {
  const { cmd } = useTauri();
  const [config, setConfig] = useState<Config>({
    mo2_exe: "",
    proton_path: "",
    wine_prefix: "",
    steam_path: "/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary",
    instances_dir: "/run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs",
    sounds_enabled: true,
    sound_mode: "jarvis",
    nxm_handler_registered: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cmd<Config>("load_config").then((r) => {
      if (r.ok && r.data) setConfig(r.data);
    });
  }, []);

  const update = (k: keyof Config) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const val = e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setConfig((c) => ({ ...c, [k]: val }));
  };

  const save = async () => {
    setSaving(true);
    const r = await cmd("save_config", { config });
    setSaving(false);
    if (r.ok) {
      playSound("notification");
      toast.ok("Config saved to ~/.config/mo2-linux-helper/config.json");
    } else {
      toast.err(r.message);
    }
  };

  const testSound = async (name: string) => {
    const r = await cmd("play_jarvis_sound", { soundName: name, mode: config.sound_mode });
    if (!r.ok) toast.err(r.message);
  };

  return (
    <div>
      <div className="section-header">
        <span className="section-title">◎ Settings</span>
      </div>

      {/* Paths */}
      <div className="card card-cyan" style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 12 }}>Paths</div>

        <div className="field">
          <label className="label">MO2 Executable (.exe)</label>
          <input className="input" value={config.mo2_exe} onChange={update("mo2_exe")}
            placeholder="~/.local/share/Steam/.../ModOrganizer.exe" />
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Proton Binary</label>
            <input className="input" value={config.proton_path} onChange={update("proton_path")}
              placeholder="Auto-detect if empty" />
          </div>
          <div className="field">
            <label className="label">Wine Prefix (pfx)</label>
            <input className="input" value={config.wine_prefix} onChange={update("wine_prefix")}
              placeholder=".../compatdata/2601980/pfx" />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Steam Library Path</label>
            <input className="input" value={config.steam_path} onChange={update("steam_path")} />
          </div>
          <div className="field">
            <label className="label">Instances / Modlist_Packs</label>
            <input className="input" value={config.instances_dir} onChange={update("instances_dir")} />
          </div>
        </div>
      </div>

      {/* Sound system */}
      <div className="card card-blue" style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 12 }}>J.A.R.V.I.S. Sound System</div>

        <div className="grid-2" style={{ marginBottom: 12 }}>
          <div className="field">
            <label className="label">Voice Mode</label>
            <select
              className="input"
              value={config.sound_mode}
              onChange={update("sound_mode")}
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              <option value="jarvis">J.A.R.V.I.S. (Paul Bettany TTS)</option>
              <option value="idroid">iDroid (Tactical / Gaming)</option>
            </select>
          </div>

          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={config.sounds_enabled}
                onChange={update("sounds_enabled")}
                style={{ accentColor: "var(--cyan)" }}
              />
              <span className="text-sm" style={{ fontWeight: 600 }}>Sounds Enabled</span>
            </label>
          </div>
        </div>

        <div className="label" style={{ marginBottom: 8 }}>Test Clips</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {JARVIS_SOUNDS.map((s) => (
            <button
              key={s}
              className="btn btn-secondary btn-sm"
              onClick={() => testSound(s)}
              disabled={!config.sounds_enabled}
            >
              ▶ {s}
            </button>
          ))}
        </div>

        <div className="text-dim text-xs mt-2">
          Clips live in <span className="mono">/usr/share/wehttamsnaps/sounds/{"{jarvis|idroid}/"}</span>
          — see <span className="mono">sound-system setup</span> for download links
        </div>
      </div>

      {/* NXM status */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 3 }}>NXM Handler</div>
            <div className="text-dim text-sm">
              Registered: {" "}
              <span className={config.nxm_handler_registered ? "text-cyan" : "text-muted"}>
                {config.nxm_handler_registered ? "Yes" : "No — go to NXM tab"}
              </span>
            </div>
          </div>
          <span className={`badge ${config.nxm_handler_registered ? "badge-ok" : "badge-warn"}`}>
            {config.nxm_handler_registered ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "◎ Save Configuration"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            cmd<Config>("load_config").then((r) => {
              if (r.ok && r.data) {
                setConfig(r.data);
                toast.info("Config reloaded");
              }
            });
          }}
        >
          ↺ Reload
        </button>
      </div>

      <div className="text-muted text-xs mt-2">
        Saved to <span className="mono">~/.config/mo2-linux-helper/config.json</span>
      </div>
    </div>
  );
}
