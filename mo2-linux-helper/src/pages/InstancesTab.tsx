import { useState, useEffect } from "react";
import { useTauri } from "../hooks/useTauri";
import { open } from "@tauri-apps/plugin-dialog";

interface Instance {
  name: string;
  path: string;
  game: string;
  profile: string;
  last_used: string | null;
}

interface Props {
  toast: { ok(m: string): void; err(m: string): void; info(m: string): void };
  playSound(name: string): void;
}

export default function InstancesTab({ toast, playSound }: Props) {
  const { cmd } = useTauri();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [instancesDir, setInstancesDir] = useState(
    "/run/media/wehttamsnaps/LINUXDRIVE/Modlist_Packs"
  );
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const [mo2Exe, setMo2Exe] = useState("");
  const [protonPath, setProtonPath] = useState("");
  const [winePrefix, setWinePrefix] = useState("");

  useEffect(() => {
    cmd<{ mo2_exe: string; proton_path: string; wine_prefix: string; instances_dir: string }>(
      "load_config"
    ).then((r) => {
      if (r.ok && r.data) {
        setMo2Exe(r.data.mo2_exe);
        setProtonPath(r.data.proton_path);
        setWinePrefix(r.data.wine_prefix);
        setInstancesDir(r.data.instances_dir);
        scan(r.data.instances_dir);
      }
    });
  }, []);

  const scan = async (dir?: string) => {
    setLoading(true);
    const r = await cmd<Instance[]>("list_instances", { instancesDir: dir ?? instancesDir });
    setLoading(false);
    if (r.ok && r.data) {
      setInstances(r.data);
      toast.info(`Found ${r.data.length} instances`);
    } else {
      toast.err(r.message);
    }
  };

  const launch = async (inst: Instance) => {
    setLaunching(inst.name);
    playSound("steam-launch");
    const r = await cmd("launch_instance", {
      mo2Exe, protonPath, winePrefix,
      instancePath: inst.path,
    });
    setLaunching(null);
    if (r.ok) {
      toast.ok(`Launched: ${inst.name}`);
      playSound("notification");
    } else {
      toast.err(r.message);
    }
  };

  const browse = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") {
      setInstancesDir(selected);
      scan(selected);
    }
  };

  const openDir = async (path: string) => {
    await cmd("open_directory", { path });
  };

  return (
    <div>
      <div className="section-header">
        <span className="section-title">⬡ Portable Instances</span>
        <span className="text-dim text-sm">
          {instances.length} instance{instances.length !== 1 ? "s" : ""} in scan path
        </span>
      </div>

      {/* Scan path */}
      <div className="card card-cyan" style={{ marginBottom: 16 }}>
        <label className="label">Instances Directory</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            value={instancesDir}
            onChange={(e) => setInstancesDir(e.target.value)}
            placeholder="/path/to/Modlist_Packs"
          />
          <button className="btn btn-secondary" onClick={browse}>Browse</button>
          <button className="btn btn-primary" onClick={() => scan()} disabled={loading}>
            {loading ? "Scanning…" : "Scan"}
          </button>
        </div>
        <p className="text-dim text-xs mt-2">
          Scans subdirectories for <span className="mono">ModOrganizer.ini</span> or <span className="mono">mods/</span> folder
        </p>
      </div>

      {/* Instance list */}
      {instances.length === 0 && !loading && (
        <div style={{
          textAlign: "center",
          padding: "48px 24px",
          color: "var(--text-muted)",
          border: "1px dashed var(--border)",
          borderRadius: 6,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: "0.15em" }}>
            NO INSTANCES FOUND
          </div>
          <div className="text-sm mt-2">
            Set the directory above and click Scan
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {instances.map((inst) => (
          <div
            key={inst.path}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              borderLeft: "3px solid var(--blue)",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{inst.name}</span>
                {inst.game !== "Unknown" && (
                  <span className="badge badge-blue">{inst.game}</span>
                )}
              </div>
              <div
                className="mono text-xs text-muted"
                style={{ cursor: "pointer" }}
                onClick={() => openDir(inst.path)}
                title="Open in file manager"
              >
                {inst.path}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openDir(inst.path)}
              >
                📁 Open
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => launch(inst)}
                disabled={launching === inst.name}
              >
                {launching === inst.name ? "Launching…" : "▶ Launch"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick launch config */}
      {instances.length > 0 && (
        <div className="card mt-4" style={{ marginTop: 20 }}>
          <div className="section-header">
            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.15em" }}>
              LAUNCH CONFIGURATION
            </span>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="label">MO2 Executable</label>
              <input className="input" value={mo2Exe} onChange={(e) => setMo2Exe(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Wine Prefix (pfx path)</label>
              <input className="input" value={winePrefix} onChange={(e) => setWinePrefix(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">Proton Path (auto-detected if empty)</label>
            <input
              className="input"
              value={protonPath}
              onChange={(e) => setProtonPath(e.target.value)}
              placeholder="Leave empty to auto-detect"
            />
          </div>
        </div>
      )}
    </div>
  );
}
