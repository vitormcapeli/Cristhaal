import type { CSSProperties } from "react";
import { INK, mix } from "@/lib/geometry";
import { LOGO_C as C, LOGO_SHAPE as SHAPE, SHARDS } from "@/lib/logoShape";
import { Prism } from "./Prism";

type Props = { text?: boolean; className?: string; label?: string };

/** Logo separado em peças para poder animar cada uma (veja HeroLogo e as classes .lg-* no CSS). */
export function Logo({ text = true, className = "logo", label = "Logo do Projeto Cristhaal" }: Props) {
  const textProps = {
    x: 200, y: 214, textAnchor: "middle" as const, fontSize: 54, textLength: 246, lengthAdjust: "spacingAndGlyphs" as const,
    transform: "rotate(-11 200 200)", style: { fontFamily: "var(--script)" },
  };
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      <path className="lg-fill" d={SHAPE.d} fill="#ffffff" />
      {SHARDS.map(([a, len, w, col], i) => (
        <g key={i} transform={`rotate(${a} ${C} ${C})`}>
          <g className="lg-shard" data-a={a} style={{ "--d": `${(1.35 + i * 0.075).toFixed(2)}s` } as CSSProperties}>
            <Prism cx={C} by={C - 12} len={len * 0.86} w={w * 0.82} left={col || "#ffffff"} right={col ? mix(col, "#ffffff", 0.62) : "#ffffff"} sw={2.6} />
          </g>
        </g>
      ))}
      {text && (
        <>
          <text {...textProps} className="lg-halo" fill="#ffffff" stroke="#ffffff" strokeWidth={13} strokeLinejoin="round">Cristhaal</text>
          <text {...textProps} className="lg-ink" fill={INK} stroke={INK} strokeWidth={1.3}>Cristhaal</text>
        </>
      )}
      <path className="lg-border" d={SHAPE.d} pathLength={1} fill="none" stroke={INK} strokeWidth={3.2} strokeLinejoin="round" />
      {SHAPE.dots.map((p, k) => (
        <circle
          key={k} className="lg-dot" cx={p.x} cy={p.y} r={11.5} fill={p.c} stroke={INK} strokeWidth={2.4}
          style={{ "--d": `${(k * 0.04).toFixed(2)}s`, "--fx": `${p.fx}px`, "--fy": `${p.fy}px` } as CSSProperties}
        />
      ))}
    </svg>
  );
}
