type P = { size?: number };

export function InstagramIcon({ size = 22 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function YoutubeIcon({ size = 22 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor" />
    </svg>
  );
}

export function SunIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function MoonIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ListIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11" {...stroke} />
      <circle cx="4.5" cy="6" r="1.5" fill="currentColor" /><circle cx="4.5" cy="12" r="1.5" fill="currentColor" /><circle cx="4.5" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function PhotoIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="3" {...stroke} />
      <circle cx="9" cy="10" r="1.8" fill="currentColor" />
      <path d="M4 18l5.5-5 4 3.5 2.5-2 4 3.5" {...stroke} />
    </svg>
  );
}

export function UndoIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 7 4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H12" {...stroke} />
    </svg>
  );
}

export function RedoIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ transform: "scaleX(-1)" }}>
      <path d="M9 7 4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H12" {...stroke} />
    </svg>
  );
}

export function StepsIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="6" r="2.2" {...stroke} /><circle cx="5" cy="18" r="2.2" {...stroke} />
      <path d="M10 6h10M10 18h10M5 8.5v7" {...stroke} />
    </svg>
  );
}

export function GripIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 12h17M3.5 12l3.5-3.5M3.5 12 7 15.5M20.5 12 17 8.5M20.5 12 17 15.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OrderedListIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 6h10M10 12h10M10 18h10" {...stroke} />
      <path d="M4 4.5 5.5 4v4.5M3.8 14.2a1.5 1.5 0 1 1 2.4 1.6L3.8 19h2.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QuoteIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5v14" {...stroke} />
      <path d="M9 8h11M9 12h11M9 16h7" {...stroke} />
    </svg>
  );
}

export function LinkIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" {...stroke} />
    </svg>
  );
}

export function HighlightIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 4.5 5 5L11 18H6v-5z" {...stroke} />
      <path d="M3 21h18" stroke="var(--yellow)" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

export function AlignIcon({ size = 20, al }: P & { al: "left" | "center" | "right" }) {
  const d = { left: "M4 6h16M4 10h10M4 14h16M4 18h10", center: "M4 6h16M7 10h10M4 14h16M7 18h10", right: "M4 6h16M10 10h10M4 14h16M10 18h10" }[al];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} {...stroke} />
    </svg>
  );
}

export function GalleryIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="8" height="7" rx="2" {...stroke} /><rect x="13" y="4" width="8" height="7" rx="2" {...stroke} />
      <rect x="3" y="13" width="8" height="7" rx="2" {...stroke} /><rect x="13" y="13" width="8" height="7" rx="2" {...stroke} />
    </svg>
  );
}

export function CalloutIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="4" {...stroke} />
      <path d="M8 4v16" {...stroke} />
      <path d="M12 10h5M12 14h4" {...stroke} />
    </svg>
  );
}

export function DividerIcon({ size = 20 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h4M17 12h4" {...stroke} />
      <path d="m12 9 3 3-3 3-3-3z" fill="currentColor" />
    </svg>
  );
}

export function ArrowIcon({ size = 18, dir }: P & { dir: "up" | "down" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={dir === "down" ? { transform: "rotate(180deg)" } : undefined}>
      <path d="M12 19V5M6 11l6-6 6 6" {...stroke} />
    </svg>
  );
}

export function TrashIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" {...stroke} />
    </svg>
  );
}

export function DotsIcon({ size = 18 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="6" r="1.7" fill="currentColor" /><circle cx="15" cy="6" r="1.7" fill="currentColor" />
      <circle cx="9" cy="12" r="1.7" fill="currentColor" /><circle cx="15" cy="12" r="1.7" fill="currentColor" />
      <circle cx="9" cy="18" r="1.7" fill="currentColor" /><circle cx="15" cy="18" r="1.7" fill="currentColor" />
    </svg>
  );
}
