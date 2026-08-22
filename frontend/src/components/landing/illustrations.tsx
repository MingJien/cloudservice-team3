"use client";

/**
 * Premium SVG illustrations for cloud service plans & featured sections.
 * Vector-based for infinite scalability, animated with CSS for premium feel.
 * Design: Apple Product Render style — minimal, cinematic lighting.
 */

/* ─── Featured VPS Hero Illustration ─── */
export function FeaturedVpsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fv-body" x1="140" y1="40" x2="260" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="fv-face" x1="160" y1="60" x2="240" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
        </linearGradient>
        <linearGradient id="fv-glow" x1="200" y1="80" x2="200" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
        </linearGradient>
        <filter id="fv-blur">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="fv-glow-f">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Background glow */}
      <ellipse cx="200" cy="160" rx="120" ry="90" fill="url(#fv-glow)" filter="url(#fv-blur)" opacity="0.7">
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="4s" repeatCount="indefinite" />
      </ellipse>

      {/* Server body — isometric rack */}
      <g transform="translate(120, 50)">
        {/* Main body */}
        <rect x="20" y="30" width="120" height="180" rx="8" fill="url(#fv-body)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <rect x="25" y="35" width="110" height="170" rx="6" fill="url(#fv-face)" />

        {/* Drive bays */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i} transform={`translate(35, ${50 + i * 32})`}>
            <rect width="90" height="22" rx="3" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <rect x="4" y="7" width="58" height="8" rx="1.5" fill="rgba(255,255,255,0.06)" />
            {/* LED indicators */}
            <circle cx="76" cy="11" r="2.5" fill="#22d3ee" opacity="0.8">
              <animate attributeName="opacity" values="0.4;1;0.4" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            <circle cx="83" cy="11" r="2" fill="#8b5cf6" opacity="0.5">
              <animate attributeName="opacity" values="0.3;0.7;0.3" dur={`${2 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        {/* Top ventilation */}
        <g opacity="0.15">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={32 + i * 12} y="36" width="6" height="1.5" rx="0.75" fill="white" />
          ))}
        </g>
      </g>

      {/* Floating holographic panels */}
      <g opacity="0.6">
        {/* Left panel */}
        <g transform="translate(55, 80) rotate(-5)">
          <rect width="55" height="60" rx="6" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.2)" strokeWidth="0.5" />
          <rect x="6" y="8" width="28" height="3" rx="1.5" fill="rgba(139,92,246,0.3)" />
          <rect x="6" y="16" width="43" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
          <rect x="6" y="22" width="35" height="2" rx="1" fill="rgba(255,255,255,0.06)" />
          {/* Mini chart */}
          <polyline points="8,48 15,42 22,44 29,36 36,38 43,32" fill="none" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.6" />
        </g>

        {/* Right panel */}
        <g transform="translate(290, 100) rotate(4)">
          <rect width="60" height="55" rx="6" fill="rgba(34,211,238,0.06)" stroke="rgba(34,211,238,0.18)" strokeWidth="0.5" />
          <rect x="6" y="8" width="32" height="3" rx="1.5" fill="rgba(34,211,238,0.3)" />
          <rect x="6" y="16" width="48" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
          <rect x="6" y="22" width="38" height="2" rx="1" fill="rgba(255,255,255,0.06)" />
          {/* Mini bars */}
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={8 + i * 13} y={46 - (12 + i * 4)} width="8" height={12 + i * 4} rx="1" fill="rgba(34,211,238,0.2)" />
          ))}
        </g>
      </g>

      {/* Data stream particles */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} r="1.5" fill={i % 2 === 0 ? "#22d3ee" : "#a78bfa"} opacity="0.6">
          <animate attributeName="cx" values={`${160 + i * 15};${180 + i * 10};${160 + i * 15}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="cy" values={`${60 + i * 8};${200 + i * 5};${60 + i * 8}`} dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.8;0" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
        </circle>
      ))}

      {/* Connection lines */}
      <line x1="100" y1="150" x2="65" y2="110" stroke="rgba(139,92,246,0.15)" strokeWidth="0.5" strokeDasharray="3 3">
        <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
      </line>
      <line x1="260" y1="140" x2="295" y2="120" stroke="rgba(34,211,238,0.15)" strokeWidth="0.5" strokeDasharray="3 3">
        <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="3.5s" repeatCount="indefinite" />
      </line>
    </svg>
  );
}

/* ─── Plan Card Illustrations ─── */

export function CloudServerIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cs-g" x1="40" y1="20" x2="120" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e66a5" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* Glow */}
      <ellipse cx="80" cy="65" rx="40" ry="30" fill="rgba(30,102,165,0.1)" filter="url(#fv-blur)" />
      {/* Server tower */}
      <rect x="52" y="22" width="56" height="76" rx="6" fill="url(#cs-g)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
      <rect x="56" y="26" width="48" height="68" rx="4" fill="rgba(255,255,255,0.04)" />
      {/* Drive slots */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="60" y={32 + i * 15} width="40" height="10" rx="2" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
          <circle cx="94" cy={37 + i * 15} r="2" fill="#22d3ee" opacity="0.7">
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${1.8 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      {/* Cloud connection arc */}
      <path d="M38 45 Q30 25 50 20 Q65 12 80 18 Q95 12 110 20 Q130 25 122 45" stroke="rgba(30,102,165,0.2)" strokeWidth="0.8" fill="none" strokeDasharray="3 2" />
    </svg>
  );
}

export function HostingIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hi-g" x1="40" y1="20" x2="120" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* Globe */}
      <circle cx="80" cy="55" r="32" fill="none" stroke="url(#hi-g)" strokeWidth="1.2" />
      <ellipse cx="80" cy="55" rx="18" ry="32" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="0.7" />
      <line x1="48" y1="55" x2="112" y2="55" stroke="rgba(99,102,241,0.1)" strokeWidth="0.5" />
      <line x1="80" y1="23" x2="80" y2="87" stroke="rgba(99,102,241,0.1)" strokeWidth="0.5" />
      {/* Orbit dots */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60) * Math.PI / 180;
        const cx = 80 + Math.cos(angle) * 38;
        const cy = 55 + Math.sin(angle) * 28;
        return (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill={i % 2 === 0 ? "rgba(99,102,241,0.4)" : "rgba(167,139,250,0.3)"} stroke="rgba(255,255,255,0.1)" strokeWidth="0.3">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
      {/* Browser window floating */}
      <g transform="translate(105, 22) rotate(6)">
        <rect width="36" height="26" rx="3" fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.2)" strokeWidth="0.5" />
        <rect x="2" y="2" width="32" height="5" rx="1.5" fill="rgba(99,102,241,0.1)" />
        <circle cx="5" cy="4.5" r="1" fill="rgba(255,100,100,0.4)" />
        <circle cx="8.5" cy="4.5" r="1" fill="rgba(255,200,50,0.4)" />
        <circle cx="12" cy="4.5" r="1" fill="rgba(50,200,100,0.4)" />
      </g>
    </svg>
  );
}

export function SecurityIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="si-g" x1="60" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* Shield */}
      <path d="M80 18 L112 32 L112 62 Q112 88 80 102 Q48 88 48 62 L48 32 Z" fill="url(#si-g)" stroke="rgba(245,158,11,0.2)" strokeWidth="0.8" />
      <path d="M80 26 L106 38 L106 62 Q106 84 80 96 Q54 84 54 62 L54 38 Z" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
      {/* Lock icon */}
      <rect x="70" y="52" width="20" height="18" rx="3" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" strokeWidth="0.7" />
      <path d="M74 52 L74 46 Q74 38 80 38 Q86 38 86 46 L86 52" fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="80" cy="60" r="2" fill="rgba(245,158,11,0.5)" />
      <line x1="80" y1="62" x2="80" y2="65" stroke="rgba(245,158,11,0.4)" strokeWidth="1" strokeLinecap="round" />
      {/* Hex grid pattern */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60 + 30) * Math.PI / 180;
        const cx = 80 + Math.cos(angle) * 44;
        const cy = 58 + Math.sin(angle) * 38;
        return (
          <polygon
            key={i}
            points={[0, 1, 2, 3, 4, 5].map((j) => {
              const a = (j * 60) * Math.PI / 180;
              return `${cx + Math.cos(a) * 6},${cy + Math.sin(a) * 6}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(245,158,11,0.08)"
            strokeWidth="0.4"
          />
        );
      })}
    </svg>
  );
}

export function DomainIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="di-g" x1="40" y1="30" x2="120" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* @ symbol stylized */}
      <circle cx="80" cy="58" r="28" fill="none" stroke="url(#di-g)" strokeWidth="2.5" />
      <path d="M95 58 Q95 45 80 45 Q65 45 65 58 Q65 71 80 71 Q90 71 95 64 L95 72 Q88 80 75 78 Q56 76 56 58 Q56 40 80 38 Q104 40 104 58 Q104 68 98 72" fill="none" stroke="rgba(16,185,129,0.35)" strokeWidth="1.8" strokeLinecap="round" />
      {/* DNS connection nodes */}
      {[[38, 35], [122, 35], [38, 82], [122, 82]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.2)" strokeWidth="0.5" />
          <circle cx={x} cy={y} r="1.5" fill="rgba(16,185,129,0.4)">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
          </circle>
          <line x1={x} y1={y} x2={x > 80 ? x - 15 : x + 15} y2={y < 60 ? y + 10 : y - 10} stroke="rgba(16,185,129,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
        </g>
      ))}
    </svg>
  );
}

export function EmailIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ei-g" x1="40" y1="30" x2="120" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* Envelope */}
      <rect x="40" y="36" width="80" height="52" rx="6" fill="rgba(34,211,238,0.06)" stroke="url(#ei-g)" strokeWidth="1" />
      {/* Flap */}
      <path d="M40 36 L80 62 L120 36" fill="none" stroke="rgba(34,211,238,0.2)" strokeWidth="0.8" />
      {/* Inner lines */}
      <line x1="50" y1="82" x2="72" y2="65" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" />
      <line x1="110" y1="82" x2="88" y2="65" stroke="rgba(34,211,238,0.1)" strokeWidth="0.5" />
      {/* Signal waves */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${125 + i * 8} 45 Q${130 + i * 8} 55 ${125 + i * 8} 65`} fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1" strokeLinecap="round">
          <animate attributeName="opacity" values="0;0.5;0" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.3}s`} />
        </path>
      ))}
    </svg>
  );
}

/* ─── Blog Article Illustrations ─── */

export function BlogInfrastructureIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bi-sky" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e66a5" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#bi-sky)" />
      {/* Abstract buildings */}
      {[
        { x: 30, w: 40, h: 90 },
        { x: 80, w: 35, h: 110 },
        { x: 125, w: 45, h: 75 },
        { x: 180, w: 50, h: 130 },
        { x: 240, w: 38, h: 95 },
        { x: 290, w: 42, h: 115 },
        { x: 340, w: 35, h: 80 },
      ].map(({ x, w, h }, i) => (
        <g key={i}>
          <rect x={x} y={200 - h} width={w} height={h} rx="3" fill={`rgba(30,102,165,${0.08 + i * 0.02})`} stroke="rgba(30,102,165,0.12)" strokeWidth="0.5" />
          {/* Windows */}
          {Array.from({ length: Math.floor(h / 18) }).map((_, j) => (
            <rect key={j} x={x + 5} y={200 - h + 8 + j * 18} width={w - 10} height="8" rx="1" fill={`rgba(34,211,238,${0.04 + (j % 3) * 0.03})`} />
          ))}
        </g>
      ))}
      {/* Connection lines between buildings */}
      <path d="M50 140 Q115 100 200 135 Q285 100 360 125" fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="1" strokeDasharray="4 3" />
      <path d="M95 110 Q200 75 310 105" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="0.8" strokeDasharray="3 3" />
    </svg>
  );
}

export function BlogCloudDeployIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bcd-bg" x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#bcd-bg)" />
      {/* Floating geometric shapes */}
      {[
        { x: 60, y: 80, size: 28, type: "cube" },
        { x: 140, y: 50, size: 22, type: "sphere" },
        { x: 220, y: 110, size: 32, type: "cube" },
        { x: 300, y: 65, size: 26, type: "sphere" },
        { x: 350, y: 130, size: 20, type: "cube" },
      ].map(({ x, y, size, type }, i) => (
        <g key={i}>
          {type === "cube" ? (
            <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={size * 0.15} fill={`rgba(34,211,238,${0.06 + i * 0.02})`} stroke="rgba(34,211,238,0.15)" strokeWidth="0.6" transform={`rotate(${15 + i * 8}, ${x}, ${y})`} />
          ) : (
            <circle cx={x} cy={y} r={size / 2} fill={`rgba(99,102,241,${0.06 + i * 0.015})`} stroke="rgba(99,102,241,0.12)" strokeWidth="0.6" />
          )}
        </g>
      ))}
      {/* Connection lines */}
      <line x1="60" y1="80" x2="140" y2="50" stroke="rgba(34,211,238,0.12)" strokeWidth="0.7" />
      <line x1="140" y1="50" x2="220" y2="110" stroke="rgba(34,211,238,0.1)" strokeWidth="0.7" />
      <line x1="220" y1="110" x2="300" y2="65" stroke="rgba(99,102,241,0.1)" strokeWidth="0.7" />
      <line x1="300" y1="65" x2="350" y2="130" stroke="rgba(99,102,241,0.08)" strokeWidth="0.7" />
      {/* Cloud arrow up */}
      <g transform="translate(190, 25)">
        <path d="M0 20 L10 8 L20 20 M10 8 L10 40" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function BlogGenericIllustration({ className, index = 0 }: { className?: string; index?: number }) {
  const palettes = [
    { from: "rgba(30,102,165,0.12)", to: "rgba(99,102,241,0.06)", accent: "rgba(30,102,165,0.2)" },
    { from: "rgba(34,211,238,0.1)", to: "rgba(30,102,165,0.06)", accent: "rgba(34,211,238,0.2)" },
    { from: "rgba(245,158,11,0.1)", to: "rgba(224,108,117,0.06)", accent: "rgba(245,158,11,0.2)" },
  ];
  const p = palettes[index % palettes.length];

  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`bg-gen-${index}`} x1="0" y1="0" x2="400" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={p.from} />
          <stop offset="100%" stopColor={p.to} />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill={`url(#bg-gen-${index})`} />
      {/* Abstract wave pattern */}
      <path d={`M0 ${140 + index * 10} Q100 ${100 + index * 8} 200 ${130 + index * 5} Q300 ${160 - index * 5} 400 ${120 + index * 8}`} fill="none" stroke={p.accent} strokeWidth="1.2" />
      <path d={`M0 ${155 + index * 8} Q100 ${120 + index * 5} 200 ${150 + index * 3} Q300 ${175 - index * 3} 400 ${140 + index * 5}`} fill="none" stroke={p.accent} strokeWidth="0.7" opacity="0.5" />
      {/* Floating dots */}
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={i} cx={30 + i * 50} cy={60 + (i % 3) * 25} r={2 + (i % 2)} fill={p.accent} opacity={0.3 + (i % 3) * 0.1} />
      ))}
    </svg>
  );
}
