import type { CSSProperties } from "react";
import type { Caixa } from "./data";

// Formatação dentro de um parágrafo: **negrito** e *itálico*. Uma barra invertida escapa o caractere
// seguinte (\* vira um asterisco de verdade). Lido por quem mostra o post e pelo editor.

export type Trecho = { t: string; b: boolean; i: boolean };

export function parseInline(src: string): Trecho[] {
  const out: Trecho[] = [];
  let b = false;
  let i = false;
  let buf = "";
  const push = () => {
    if (!buf) return;
    const last = out[out.length - 1];
    if (last && last.b === b && last.i === i) last.t += buf;
    else out.push({ t: buf, b, i });
    buf = "";
  };
  for (let k = 0; k < src.length; k++) {
    const c = src[k];
    if (c === "\\" && k + 1 < src.length) { buf += src[++k]; continue; }
    if (c === "*") {
      push();
      if (src[k + 1] === "*") { b = !b; k++; } else i = !i;
      continue;
    }
    buf += c;
  }
  push();
  return out;
}

/** Texto sem marcação, para o resumo da lista. */
export const plainText = (s: string) => parseInline(s).map((x) => x.t).join("");

export type BoxProps = { "data-al"?: string; "data-w"?: string; style?: CSSProperties };

export const W_MIN = 25;
export const validW = (w: unknown): w is number => typeof w === "number" && w >= W_MIN && w <= 100;

/** Atributos de largura e alinhamento de um bloco, iguais no editor e na página do post. */
export function boxProps(b: Caixa): BoxProps {
  const p: BoxProps = {};
  if (b.al === "left" || b.al === "center" || b.al === "right") p["data-al"] = b.al;
  if (validW(b.w)) { p["data-w"] = String(b.w); p.style = { width: `${b.w}%` }; }
  return p;
}
