import { INK, prismPoints } from "@/lib/geometry";

type Props = { cx: number; by: number; len: number; w: number; left: string; right: string; sw: number };

export function Prism({ cx, by, len, w, left, right, sw }: Props) {
  const p = prismPoints(cx, by, len, w);
  return (
    <>
      <polygon points={p.left} fill={left} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={p.right} fill={right} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    </>
  );
}
