import { useState } from "react";
import { useTauri } from "../hooks/useTauri";
import { open } from "@tauri-apps/plugin-dialog";

interface Props {
  toast: { ok(m: string): void; err(m: string): void; info(m: string): void };
  playSound(name: string): void;
}

interface Shortcut {
  name: string;
  exe: string;
  start_dir: string;
  icon: string;
  launch_options: string;
}

const MO2_PRESETS: Shortcut[] = [
  {
    name: "MO2 — Skyrim SE",
    exe: "/usr/local/bin/mo2-linux-helper",
    start_dir: "/run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs/SkyrimSE",
    icon: "/usr/share/wehttamsnaps/icons/mo2.png",
    launch_options: "--instance /run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs/SkyrimSE",
  },
  {
    name: "MO2 — Fallout 4",
    exe: "/usr/local/bin/mo2-linux-helper",
    start_dir: "/run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs/Fallout4",
    icon: "/usr/share/wehttamsnaps/icons/mo2.png",
    launch_options: "--instance /run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs/Fallout4",
  },
  {
    name: "MO2 — Starfield",
    exe: "/usr/local/bin/mo2-linux-helper",
    start_dir: "/run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs/Starfield",
    icon: "/usr/share/wehttamsnaps/icons/mo2.png",
    launch_options: "--instance /run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs/Starfield",
  },
];

export default function ShortcutsTab({ toast, playSound }: Props) {
  const { cmd } = useTauri();
  const [form, setForm] = useState<Shortcut>({
    name: "",
    exe: "",
    start_dir: "",
    icon: "",
    launch_options: "",
  });
  const [result, setResult] = useState<{ desktop_path: string; vdf_snippet: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof Shortcut) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadPreset = (p: Shortcut) => {
    setForm(p);
    setResult(null);
    toast.info(`Loaded preset: ${p.name}`);
  };

  const browseExe = async () => {
    const f = await open({ multiple: false });
    if (f && typeof f === "string") setForm((prev) => ({ ...prev, exe: f }));
  };

  const browseDir = async () => {
    const d = await open({ directory: true });
    if (d && typeof d === "string") setForm((prev) => ({ ...prev, start_dir: d }));
  };

  const create = async () => {
    if (!form.name || !form.exe) {
      toast.err("Name and Executable are required");
      return;
    }
    setLoading(true);
    const r = await cmd<{ desktop_path: string; vdf_snippet: string }>(
      "create_non_steam_shortcut",
      { shortcut: form }
    );
    setLoading(false);
    if (r.ok && r.data) {
      setResult(r.data);
      playSound("notification");
      toast.ok(`Shortcut created: ${form.name}`);
    } else {
      toast.err(r.message);
    }
  };

  return (
    <div>
      <div className="section-header">
        <span className="section-title">⚡ Non-Steam Shortcut Creator</span>
      </div>

      {/* Presets */}
      <div style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 8 }}>Quick Presets</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MO2_PRESETS.map((p) => (
            <button
              key={p.name}
              className="btn btn-secondary btn-sm"
              onClick={() => loadPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="card card-pink" style={{ marginBottom: 16 }}>
        <div className="grid-2">
          <div className="field">
            <label className="label">Shortcut Name *</label>
            <input className="input" value={form.name} onChange={update("name")} placeholder="MO2 — Skyrim SE" />
          </div>
          <div className="field">
            <label className="label">Icon Path</label>
            <input className="input" value={form.icon} onChange={update("icon")} placeholder="/path/to/icon.png" />
          </div>
        </div>

        <div className="field">
          <label className="label">Executable *</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" value={form.exe} onChange={update("exe")} placeholder="/usr/local/bin/..." />
            <button className="btn btn-secondary btn-sm" onClick={browseExe}>Browse</button>
          </div>
        </div>

        <div className="field">
          <label className="label">Start Directory</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" value={form.start_dir} onChange={update("start_dir")} placeholder="/path/to/instance" />
            <button className="btn btn-secondary btn-sm" onClick={browseDir}>Browse</button>
          </div>
        </div>

        <div className="field">
          <label className="label">Launch Options</label>
          <input
            className="input"
            value={form.launch_options}
            onChange={update("launch_options")}
            placeholder="RADV_PERFTEST=gpl gamemoderun %command%"
          />
        </div>

        <button className="btn btn-pink" onClick={create} disabled={loading}>
          {loading ? "Creating…" : "⚡ Create Shortcut"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{ borderLeft: "3px solid var(--success)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ color: "var(--success)", fontWeight: 700 }}>✓ Shortcut Created</span>
          </div>

          <div className="field">
            <div className="label">Desktop File</div>
            <div
              className="mono text-xs"
              style={{
                background: "var(--mid)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "6px 10px",
                color: "var(--cyan)",
              }}
            >
              {result.desktop_path}
            </div>
          </div>

          <div className="field">
            <div className="label" style={{ marginBottom: 6 }}>Steam VDF Snippet</div>
            <div className="text-dim text-xs" style={{ marginBottom: 6 }}>
              Paste into <span className="mono">shortcuts.vdf</span> for Steam Big Picture import
            </div>
            <pre
              className="mono"
              style={{
                background: "var(--mid)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "8px 12px",
                fontSize: 11,
                color: "var(--text-dim)",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {result.vdf_snippet}
            </pre>
          </div>

          <div className="text-dim text-sm" style={{ marginTop: 8 }}>
            To add to Steam: Library → Add a Game → Add a Non-Steam Game → Browse and select the .desktop file
          </div>
        </div>
      )}
    </div>
  );
}
