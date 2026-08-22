"use client";

/**
 * HeroBackground — Pure CSS gradient mesh with 3 animated orbs,
 * grid pattern overlay, and noise texture.
 * No images required. GPU-accelerated via will-change + filter blur.
 */
export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Gradient mesh orbs */}
      <div
        className="mesh-orb"
        style={{
          width: "55vw",
          height: "55vw",
          maxWidth: 700,
          maxHeight: 700,
          background: "radial-gradient(circle, rgba(30,102,165,0.6) 0%, transparent 70%)",
          top: "-12%",
          left: "-8%",
          animation: "drift-1 22s infinite ease-in-out",
        }}
      />
      <div
        className="mesh-orb"
        style={{
          width: "40vw",
          height: "40vw",
          maxWidth: 550,
          maxHeight: 550,
          background: "radial-gradient(circle, rgba(99,102,241,0.45) 0%, transparent 70%)",
          top: "15%",
          right: "-5%",
          animation: "drift-2 26s infinite ease-in-out",
        }}
      />
      <div
        className="mesh-orb"
        style={{
          width: "35vw",
          height: "35vw",
          maxWidth: 480,
          maxHeight: 480,
          background: "radial-gradient(circle, rgba(34,211,238,0.35) 0%, transparent 70%)",
          bottom: "-8%",
          left: "30%",
          animation: "drift-3 19s infinite ease-in-out",
        }}
      />

      {/* Grid pattern */}
      <div className="grid-pattern absolute inset-0" />

      {/* Noise texture */}
      <div className="noise-overlay absolute inset-0" />

      {/* Bottom fade to content */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background: "linear-gradient(to top, var(--color-ink-950), transparent)",
        }}
      />
    </div>
  );
}
