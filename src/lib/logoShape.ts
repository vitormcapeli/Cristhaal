// Peças do logo (releitura vetorial). Se a equipe conseguir o arquivo original (SVG/AI/PDF),
// as cores e ângulos daqui devem ser ajustados a ele.
import { f1, rng } from "./geometry";

export const LOGO_C = 200;
export const DOT_COLORS = ["#E6197F", "#3FB6E8", "#E5332A", "#8C8FD8", "#E2668E", "#F28C28", "#7CC6EC", "#2E9E7A", "#2FA84F", "#F2A81D", "#F5D312", "#E5332A"];
// ângulo (0 = para cima, sentido horário), comprimento, largura, cor (null = branco)
export const SHARDS: [number, number, number, string | null][] = [
  [24, 122, 24, null], [78, 112, 22, null], [132, 118, 24, null], [158, 126, 24, null], [208, 122, 24, null], [322, 116, 22, null], [350, 104, 20, null],
  [292, 124, 26, "#9B6FAE"], [262, 130, 28, "#3D47B5"], [236, 124, 28, "#E5332A"], [104, 126, 28, "#F28C28"], [52, 130, 30, "#E5332A"], [-8, 140, 32, "#F5D312"], [182, 142, 34, "#E6197F"],
];

function buildShape() {
  const C = LOGO_C, R = rng(7), pts: [number, number][] = [], ctl: [number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const a = ((-90 + 15 + 30 * i) * Math.PI) / 180, rr = 171 + (R() - 0.5) * 5;
    pts.push([C + rr * Math.cos(a), C + rr * Math.sin(a)]);
    const m = ((-90 + 30 + 30 * i) * Math.PI) / 180, rc = 126 + (R() - 0.5) * 6;
    ctl.push([C + rc * Math.cos(m), C + rc * Math.sin(m)]);
  }
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < 12; i++) {
    const p = pts[(i + 1) % 12], c = ctl[i];
    d += ` Q${f1(c[0])} ${f1(c[1])} ${f1(p[0])} ${f1(p[1])}`;
  }
  d += "Z";
  const dots = DOT_COLORS.map((c, k) => {
    const a = ((-90 + 30 * k) * Math.PI) / 180;
    return {
      c, x: f1(C + 184 * Math.cos(a)), y: f1(C + 184 * Math.sin(a)),
      fx: f1(Math.cos(a) * (160 + R() * 140) + (R() - 0.5) * 120),
      fy: f1(Math.sin(a) * (160 + R() * 140) + (R() - 0.5) * 120),
    };
  });
  return { d, dots };
}
export const LOGO_SHAPE = buildShape();
