// Geometria das ilustrações de cristal e do logo. Tudo determinístico (mesma semente, mesmo desenho)
// para o servidor e o navegador gerarem exatamente o mesmo SVG.

export const INK = "#1C1830";

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

export function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

export const f1 = (n: number) => Math.round(n * 10) / 10;

/** Duas faces de um prisma apontando para cima, com base em (cx, by). */
export function prismPoints(cx: number, by: number, len: number, w: number) {
  const sh = Math.min(w * 0.95, len * 0.35), tip = by - len, x0 = cx - w / 2, x1 = cx + w / 2, r = cx + w * 0.08;
  return {
    left: `${f1(x0)},${f1(by)} ${f1(x0)},${f1(tip + sh)} ${f1(cx)},${f1(tip)} ${f1(r)},${f1(by)}`,
    right: `${f1(r)},${f1(by)} ${f1(cx)},${f1(tip)} ${f1(x1)},${f1(tip + sh)} ${f1(x1)},${f1(by)}`,
  };
}
