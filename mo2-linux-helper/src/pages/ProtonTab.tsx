import { useState } from "react";
import { useTauri } from "../hooks/useTauri";

interface ProtonVersion {
  name: string;
  path: string;
}

interface WinePrefix {
  app_id: string;
  path: string;
}

interface Props {
  toast: { ok(m: string): void; err(m: string): void; info(m: string): void };
  playSound(name: string): void;
}

export default function ProtonTab({ toast, playSound }: Props) {
  const { cmd } = useTauri();
  const [protons, setProtons] = useState<ProtonVersion[]>([]);
  const [prefixes, setPrefixes] = useState<WinePrefix[]>([]);
  const [compatDataPath, setCompatDataPath] = useState(
    "/run/media/wehttamsnaps/LINUXDRIVE/SteamLibrary/steamapps/compatdata"
  );
  const [scanningProton, setScanningProton] = useState(false);
  const [scanningPrefixes, setScanningPrefixes] = useState(false);
  const [selectedProton, setSelectedProton] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState("");
  const [deps, setDeps] = useState<Record<string, boolean> | null>(null);

  const scanProton = async () => {
    setScanningProton(true);
    const r = await cmd<ProtonVersion[]>("scan_proton_versions");
    setScanningProton(false);
    if (r.ok && r.data) {
      setProtons(r.data);
      toast.info(`Found ${r.data.length} Proton versions`);
    } else {
      toast.err(r.message);
    }
  };

  const scanPrefixes = async () => {
    setScanningPrefixes(true);
    const r = await cmd<WinePrefix[]>("scan_wine_prefixes", { compatdataPath: compatDataPath });
    setScanningPrefixes(false);
    if (r.ok && r.data) {
      setPrefixes(r.data);
      toast.info(`Found ${r.data.length} Wine prefixes`);
    } else {
      toast.err(r.message);
    }
  };

  const checkDeps = async () => {
    const r = await cmd<Record<string, boolean>>("check_dependencies");
    if (r.ok && r.data) {
      setDeps(r.data);
      const missing = Object.entries(r.data).filter(([, v]) => !v).map(([k]) => k);
      if (missing.length === 0) {
        toast.ok("All dependencies found!");
        playSound("notification");
      } else {
        toast.err(`Missing: ${missing.join(", ")}`);
      }
    }
  };

  const copyPath = (path: string, label: string) => {
    navigator.clipboard.writeText(path);
    playSound("notification");
    toast.ok(`Copied ${label}`);
  };

  return (
    <div>
      <div className="section-header">
        <span className="section-title">◈ Proton &amp; Wine</span>
      </div>

      {/* Dependency check */}
      <div className="card card-cyan" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: deps ? 12 : 0 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>Dependency Check</div>
            <div className="text-dim text-sm">Verify required tools are installed</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={checkDeps}>
            ◎ Check
          </button>
        </div>

        {deps && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {Object.entries(deps).map(([name, found]) => (
              <span
                key={name}
                className={`badge ${found ? "badge-ok" : "badge-error"}`}
              >
                {found ? "✓" : "✕"} {name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Proton versions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="label" style={{ marginBottom: 0 }}>
            Proton Versions ({protons.length} found)
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={scanProton}
            disabled={scanningProton}
          >
            {scanningProton ? "Scanning…" : "Scan"}
          </button>
        </div>

        {protons.length === 0 && (
          <div className="text-muted text-sm">Click Scan to detect installed Proton versions</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {protons.map((p) => (
            <div
              key={p.path}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: selectedProton === p.path ? "var(--cyan-glow)" : "var(--mid)",
                border: `1px solid ${selectedProton === p.path ? "var(--cyan)" : "var(--border)"}`,
                borderRadius: 4,
                cursor: "pointer",
              }}
              onClick={() => setSelectedProton(p.path)}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div className="mono text-xs text-muted">{p.path}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {selectedProton === p.path && (
                  <span className="badge badge-cyan">Selected</span>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); copyPath(p.path, p.name); }}
                >
                  ⎘
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wine prefixes */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="label" style={{ marginBottom: 0 }}>
            Wine Prefixes ({prefixes.length} found)
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={scanPrefixes}
            disabled={scanningPrefixes}
          >
            {scanningPrefixes ? "Scanning…" : "Scan"}
          </button>
        </div>

        <div className="field">
          <label className="label">compatdata Path</label>
          <input
            className="input"
            value={compatDataPath}
            onChange={(e) => setCompatDataPath(e.target.value)}
          />
        </div>

        {prefixes.length === 0 && (
          <div className="text-muted text-sm">Click Scan to find Wine prefixes in compatdata</div>
        )}

        <div
          style={{
            maxHeight: 220,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginTop: 8,
          }}
        >
          {prefixes.map((p) => (
            <div
              key={p.path}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: selectedPrefix === p.path ? "var(--blue-dim)" : "var(--mid)",
                border: `1px solid ${selectedPrefix === p.path ? "var(--blue)" : "var(--border)"}`,
                borderRadius: 4,
                cursor: "pointer",
              }}
              onClick={() => setSelectedPrefix(p.path)}
            >
              <div>
                <span className="badge badge-blue" style={{ marginRight: 8 }}>{p.app_id}</span>
                <span className="mono text-xs text-muted">{p.path}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => { e.stopPropagation(); copyPath(p.path, `prefix ${p.app_id}`); }}
              >
                ⎘
              </button>
            </div>
          ))}
        </div>

        {(selectedProton || selectedPrefix) && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="label" style={{ marginBottom: 6 }}>Selected Configuration</div>
            <div
              className="mono text-xs"
              style={{
                background: "var(--mid)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "8px 12px",
                color: "var(--cyan)",
              }}
            >
              {selectedProton && <div>PROTON="{selectedProton}"</div>}
              {selectedPrefix && <div>STEAM_COMPAT_DATA_PATH="{selectedPrefix}"</div>}
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => {
                const lines = [];
                if (selectedProton) lines.push(`PROTON="${selectedProton}"`);
                if (selectedPrefix) lines.push(`STEAM_COMPAT_DATA_PATH="${selectedPrefix}"`);
                navigator.clipboard.writeText(lines.join("\n"));
                playSound("notification");
                toast.ok("Config copied");
              }}
            >
              ⎘ Copy Config
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
