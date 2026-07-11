const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

export function DryVanIcon(props) {
  return (
    <svg viewBox="0 0 64 40" {...props}>
      <rect x="2" y="8" width="40" height="20" {...base} />
      <path d="M42 14h10l6 8v6H42z" {...base} />
      <line x1="8" y1="8" x2="8" y2="28" {...base} strokeWidth="1" opacity="0.5" />
      <line x1="14" y1="8" x2="14" y2="28" {...base} strokeWidth="1" opacity="0.5" />
      <circle cx="14" cy="32" r="4" {...base} />
      <circle cx="48" cy="32" r="4" {...base} />
      <line x1="2" y1="34" x2="60" y2="34" {...base} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

export function ReeferIcon(props) {
  return (
    <svg viewBox="0 0 64 40" {...props}>
      <rect x="2" y="10" width="40" height="18" {...base} />
      <rect x="2" y="6" width="8" height="8" {...base} />
      <line x1="4" y1="8" x2="8" y2="8" {...base} strokeWidth="1" />
      <line x1="4" y1="10.5" x2="8" y2="10.5" {...base} strokeWidth="1" />
      <path d="M42 14h10l6 8v6H42z" {...base} />
      <circle cx="14" cy="32" r="4" {...base} />
      <circle cx="48" cy="32" r="4" {...base} />
      <line x1="2" y1="34" x2="60" y2="34" {...base} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

export function FlatbedIcon(props) {
  return (
    <svg viewBox="0 0 64 40" {...props}>
      <path d="M18 22h30" {...base} />
      <path d="M18 22v6M48 22v6" {...base} />
      <path d="M20 22V14h8v8M30 22V10h8v12" {...base} />
      <line x1="21" y1="12" x2="27" y2="18" {...base} strokeWidth="1" opacity="0.6" />
      <line x1="31" y1="9" x2="37" y2="21" {...base} strokeWidth="1" opacity="0.6" />
      <path d="M2 14h10l6 8v6H2z" {...base} />
      <circle cx="10" cy="32" r="4" {...base} />
      <circle cx="42" cy="32" r="4" {...base} />
      <circle cx="52" cy="32" r="4" {...base} />
    </svg>
  );
}

export function ContainerIcon(props) {
  return (
    <svg viewBox="0 0 64 40" {...props}>
      <rect x="4" y="8" width="56" height="20" {...base} />
      {Array.from({ length: 13 }).map((_, i) => (
        <line key={i} x1={4 + i * 4.6} y1="8" x2={4 + i * 4.6} y2="28" {...base} strokeWidth="0.8" opacity="0.45" />
      ))}
      <rect x="4" y="8" width="4" height="4" {...base} strokeWidth="1" />
      <rect x="56" y="24" width="4" height="4" {...base} strokeWidth="1" />
      <circle cx="16" cy="32" r="4" {...base} />
      <circle cx="48" cy="32" r="4" {...base} />
    </svg>
  );
}

export function TankerIcon(props) {
  return (
    <svg viewBox="0 0 64 40" {...props}>
      <path d="M8 12h34a6 6 0 0 1 6 6v4a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6v-4a6 6 0 0 1 6-6z" {...base} />
      <line x1="18" y1="12" x2="18" y2="28" {...base} strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="12" x2="30" y2="28" {...base} strokeWidth="1" opacity="0.5" />
      <rect x="20" y="7" width="6" height="5" {...base} strokeWidth="1" />
      <circle cx="14" cy="32" r="4" {...base} />
      <circle cx="40" cy="32" r="4" {...base} />
    </svg>
  );
}
