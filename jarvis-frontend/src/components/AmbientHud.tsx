import type { CSSProperties } from "react";

type AmbientHudProps = { active: boolean; level: number };

const signalLines = Array.from({ length: 32 }, (_, index) => {
  const progress = index / 31;
  const bell = Math.sin(progress * Math.PI);
  const baseHeight = 22 + bell * 64 + ((index * 17) % 32);
  return {
    x: 18 + index * 18,
    height: baseHeight,
    delay: `${(index % 8) * -0.15}s`,
  };
});

export function AmbientHud({ active, level }: AmbientHudProps) {
  return (
    <div
      className={`ambient-hud ${active ? "is-active" : ""}`}
      style={{ "--audio-level": level } as CSSProperties}
      aria-hidden="true"
    >
      {/* Tactical HUD Circuit Lines & Decorative Vector Layer */}
      <svg className="hud-circuit-decor" viewBox="0 0 1920 1080" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hud-cyan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00f5d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hud-cyan-grad-rev" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00f5d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Top left decorative telemetry circuit */}
        <path d="M 40 70 L 160 70 L 200 110 L 420 110" fill="none" stroke="url(#hud-cyan-grad)" strokeWidth="1.5" className="hud-line-anim" />
        <circle cx="40" cy="70" r="3" fill="#00f5d4" className="hud-node" />
        <circle cx="200" cy="110" r="2.5" fill="#00f0ff" className="hud-node" />
        <circle cx="420" cy="110" r="3.5" fill="#00f0ff" className="hud-node" />

        {/* Top right decorative telemetry circuit */}
        <path d="M 1880 70 L 1760 70 L 1720 110 L 1500 110" fill="none" stroke="url(#hud-cyan-grad-rev)" strokeWidth="1.5" className="hud-line-anim" />
        <circle cx="1880" cy="70" r="3" fill="#00f5d4" className="hud-node" />
        <circle cx="1720" cy="110" r="2.5" fill="#00f0ff" className="hud-node" />
        <circle cx="1500" cy="110" r="3.5" fill="#00f0ff" className="hud-node" />
      </svg>

      {/* Audio Visualizer Spectrum & Status */}
      <div className="visualizer-container">
        <svg className="signal-field" viewBox="0 0 594 160" preserveAspectRatio="none">
          <defs>
            <linearGradient id="signal-grad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#00d2b4" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#00f0ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Baseline track line */}
          <line x1="12" y1="148" x2="582" y2="148" stroke="rgba(0, 229, 255, 0.35)" strokeWidth="1.5" strokeDasharray="4 3" />

          {signalLines.map((line, index) => (
            <line
              className="signal-line"
              key={line.x}
              style={{ "--line-delay": line.delay } as CSSProperties}
              x1={line.x}
              x2={line.x}
              y1="146"
              y2={146 - line.height - (index % 4) * 6}
            />
          ))}
        </svg>

        <div className="hud-caption">
          <span className="hud-status-dot" />
          <span>{active ? "AUDIO LINK // ACTIVE CAPTURE" : "AUDIO LINK // TELEMETRY STANDBY"}</span>
        </div>
      </div>
    </div>
  );
}
