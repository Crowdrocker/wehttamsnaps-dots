import { useState } from "react";
import { useTauri } from "../hooks/useTauri";

interface Props {
  toast: { ok(m: string): void; err(m: string): void; info(m: string): void };
  playSound(name: string): void;
}

interface ParsedNxm {
  game: string;
  mod_id: string;
  file_id: string;
  raw: string;
}

export default function NxmTab({ toast, playSound }: Props) {
  const { cmd } = useTauri();
  const [registered, setRegistered] = useState(false);
  const [testUrl, setTestUrl] = useState("nxm://skyrimspecialedition/mods/12345/files/67890?key=abc");
  const [parsed, setParsed] = useState<ParsedNxm | null>(null);
  const [checking, setChecking] = useState(false);

  const register = async () => {
    setChecking(true);
    const appPath = "/usr/local/bin/mo2-linux-helper";
    const r = await cmd("register_nxm_handler", { appPath });
    setChecking(false);
    if (r.ok) {
      setRegistered(true);
      playSound("notification");
      toast.ok("NXM handler registered! Nexus Mods links will now open MO2.");
    } else {
      toast.err(r.message);
    }
  };

  const testParse = async () => {
    const r = await cmd<ParsedNxm>("handle_nxm_url", { url: testUrl });
    if (r.ok && r.data) {
      setParsed(r.data);
    } else {
      toast.err(r.message);
    }
  };

  return (
    <div>
      <div className="section-header">
        <span className="section-title">⬇ NXM Link Handler</span>
      </div>

      {/* Status card */}
      <div
        className="card"
        style={{
          borderLeft: `3px solid ${registered ? "var(--success)" : "var(--warning)"}`,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>NXM Scheme Handler</span>
              <span className={`badge ${registered ? "badge-ok" : "badge-warn"}`}>
                {registered ? "✓ REGISTERED" : "⚠ NOT REGISTERED"}
              </span>
            </div>
            <div className="text-dim text-sm">
              Clicking "Mod Manager Download" on Nexus Mods will open this app
              and pass the download to your active MO2 instance.
            </div>
          </div>
          <button
            className={`btn ${registered ? "btn-secondary" : "btn-primary"}`}
            onClick={register}
            disabled={checking}
            style={{ flexShrink: 0, marginLeft: 16 }}
          >
            {checking ? "Registering…" : registered ? "Re-register" : "Register Handler"}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="card card-blue" style={{ marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 10 }}>How It Works</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
          {[
            ["1", "Register", "Writes a .desktop file and registers nxm:// with xdg-mime"],
            ["2", "Browse",   "Go to Nexus Mods and click \"Mod Manager Download\""],
            ["3", "Intercept","This app receives the NXM URL and parses the mod/file IDs"],
            ["4", "Forward",  "The download is queued into your active MO2 instance via IPC"],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span
                className="badge badge-blue"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                {num}
              </span>
              <div>
                <span style={{ fontWeight: 700, color: "var(--blue)" }}>{title}</span>
                <span className="text-dim" style={{ marginLeft: 8 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test parser */}
      <div className="card">
        <div className="label" style={{ marginBottom: 10 }}>Test URL Parser</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="input"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="nxm://game/mods/123/files/456"
          />
          <button className="btn btn-secondary" onClick={testParse}>Parse</button>
        </div>

        {parsed && (
          <div
            style={{
              background: "var(--mid)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: 12,
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              gap: "6px 12px",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 12,
            }}
          >
            <span className="text-muted">Game</span>
            <span className="text-cyan">{parsed.game}</span>
            <span className="text-muted">Mod ID</span>
            <span style={{ color: "var(--blue)" }}>{parsed.mod_id}</span>
            <span className="text-muted">File ID</span>
            <span style={{ color: "var(--blue)" }}>{parsed.file_id}</span>
            <span className="text-muted">Raw URL</span>
            <span className="text-dim" style={{ wordBreak: "break-all" }}>{parsed.raw}</span>
          </div>
        )}
      </div>

      {/* Manual command */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="label" style={{ marginBottom: 6 }}>Manual Registration (fallback)</div>
        <div className="text-dim text-sm" style={{ marginBottom: 8 }}>
          If the automatic registration doesn't work, run these manually:
        </div>
        <pre
          className="mono"
          style={{
            background: "var(--mid)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "10px 14px",
            fontSize: 11,
            color: "var(--cyan)",
            overflowX: "auto",
          }}
        >
{`xdg-mime default mo2-linux-helper-nxm.desktop x-scheme-handler/nxm
update-desktop-database ~/.local/share/applications/
xdg-mime query default x-scheme-handler/nxm  # verify`}
        </pre>
      </div>
    </div>
  );
}
