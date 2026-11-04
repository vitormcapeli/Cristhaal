import { INK, f1, mix, rng } from "@/lib/geometry";
import { Prism } from "./Prism";

type Props = { seed: number; color: string; w?: number; h?: number; className?: string };

/** Aglomerado de cristais gerado a partir de uma semente. Fica no lugar das fotos enquanto elas não existem. */
export function CrystalArt({ seed, color, w = 400, h = 240, className = "art" }: Props) {
  const r = rng(seed);
  const dots: React.ReactNode[] = [];
  for (let y = 0, row = 0; y < h + 20; y += 19, row++)
    for (let x = row % 2 ? 11 : 0; x < w + 20; x += 22)
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={f1(y)} r={1.4} fill={color} opacity={0.35} />);

  const groups = 1 + (r() > 0.55 ? 1 : 0);
  const clusters: React.ReactNode[] = [];
  for (let g = 0; g < groups; g++) {
    const bx = w * (groups === 1 ? 0.38 + r() * 0.24 : g ? 0.68 + r() * 0.12 : 0.2 + r() * 0.12);
    const by = h + 8;
    const n = 4 + Math.floor(r() * 4);
    const shards = Array.from({ length: n }, () => ({
      a: -58 + r() * 116, len: h * (0.42 + r() * 0.5) * (groups > 1 ? 0.8 : 1), w: 20 + r() * 22, white: r() < 0.22, dark: r() < 0.4,
    })).sort((p, q) => q.len - p.len);
    shards.forEach((t, i) => {
      const left = t.white ? "#ffffff" : t.dark ? mix(color, INK, 0.18) : color;
      const right = t.white ? mix(color, "#ffffff", 0.9) : mix(color, "#ffffff", 0.55);
      clusters.push(
        <g key={`${g}-${i}`} transform={`rotate(${f1(t.a)} ${f1(bx)} ${by})`}>
          <Prism cx={bx} by={by} len={t.len} w={t.w} left={left} right={right} sw={2.2} />
        </g>,
      );
    });
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <rect width={w} height={h} fill={mix(color, "#ffffff", 0.86)} />
      {dots}
      {clusters}
    </svg>
  );
}
