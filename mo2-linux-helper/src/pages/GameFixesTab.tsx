import { useState, useEffect } from "react";
import { useTauri } from "../hooks/useTauri";

interface GameFix {
  id: string;
  game: string;
  description: string;
  env_vars: [string, string][];
  proton_args: string[];
  notes: string;
}

interface Props {
  toast: { ok(m: string): void; err(m: string): void; info(m: string): void };
  playSound(name: string): void;
}

export default function GameFixesTab({ toast, playSound }: Props) {
  const { cmd } = useTauri();
  const [fixes, setFixes] = useState<GameFix[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    cmd<GameFix[]>("get_game_fixes").then((r) => {
      if (r.ok && r.data) setFixes(r.data);
    });
  }, []);

  const filtered = fixes.filter((f) =>
    f.game.toLowerCase().includes(search.toLowerCase()) ||
    f.description.toLowerCase().includes(search.toLowerCase())
  );

  const buildLaunchOptions = (fix: GameFix): string => {
    const env = fix.env_vars.map(([k, v]) => `${k}=${v}`).join(" ");
    const args = fix.proton_args.join(" ");
    return [env, args, "%command%"].filter(Boolean).join(" ");
  };

  const copyLaunchOptions = async (fix: GameFix) => {
    const opts = buildLaunchOptions(fix);
    await navigator.clipboard.writeText(opts);
    setCopied(fix.id);
    playSound("notification");
    toast.ok(`Copied launch options for ${fix.game}`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      <div className="section-header">
        <span className="section-title">⚙ Game Fix Profiles</span>
        <span className="text-dim text-sm">{fixes.length} profiles</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="// Search games…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((fix) => (
          <div
            key={fix.id}
            className="card"
            style={{ borderLeft: "3px solid var(--cyan)", cursor: "pointer" }}
            onClick={() => setExpanded(expanded === fix.id ? null : fix.id)}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{fix.game}</span>
                <span className="text-dim text-xs">{fix.description}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {fix.env_vars.length} env vars
                </span>
                <span style={{ color: "var(--cyan)", fontSize: 12 }}>
                  {expanded === fix.id ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {/* Expanded */}
            {expanded === fix.id && (
              <div
                style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Env vars */}
                {fix.env_vars.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="label" style={{ marginBottom: 6 }}>Environment Variables</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {fix.env_vars.map(([k, v]) => (
                        <span
                          key={k}
                          className="badge badge-cyan"
                          style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10 }}
                        >
                          {k}=<span style={{ color: "var(--text)" }}>{v}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proton args */}
                {fix.proton_args.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="label" style={{ marginBottom: 6 }}>Prefixed Commands</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {fix.proton_args.map((a) => (
                        <span key={a} className="badge badge-blue">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full launch options */}
                <div style={{ marginBottom: 12 }}>
                  <div className="label" style={{ marginBottom: 6 }}>Steam Launch Options</div>
                  <div
                    className="mono"
                    style={{
                      background: "var(--mid)",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "8px 12px",
                      fontSize: 11,
                      color: "var(--cyan)",
                      wordBreak: "break-all",
                    }}
                  >
                    {buildLaunchOptions(fix)}
                  </div>
                </div>

                {/* Notes */}
                {fix.notes && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="label" style={{ marginBottom: 4 }}>Notes</div>
                    <div className="text-dim text-sm">{fix.notes}</div>
                  </div>
                )}

                <button
                  className={`btn ${copied === fix.id ? "btn-secondary" : "btn-primary"} btn-sm`}
                  onClick={() => copyLaunchOptions(fix)}
                >
                  {copied === fix.id ? "✓ Copied!" : "⎘ Copy Launch Options"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          No profiles matching "{search}"
        </div>
      )}
    </div>
  );
}
