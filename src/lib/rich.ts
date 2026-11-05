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
