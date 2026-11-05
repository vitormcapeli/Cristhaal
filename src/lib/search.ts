import type { Post } from "./data";
import { plainText } from "./rich";

/** Minúsculas e sem acentos: "História" e "historia" viram a mesma coisa. */
export const semAcento = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const cache = new WeakMap<Post, string>();

/** Tudo o que a busca olha num post: título, resumo, subtítulos, parágrafos, listas e legendas. */
export function textoBusca(p: Post): string {
  let t = cache.get(p);
  if (t === undefined) {
    const partes = [p.titulo, p.resumo];
    for (const b of p.corpo ?? []) {
      if ("p" in b) partes.push(plainText(b.p));
      else if ("h" in b) partes.push(b.h);
      else if ("ul" in b) partes.push(...b.ul.map(plainText));
      else if ("img" in b && b.leg) partes.push(b.leg);
    }
    t = semAcento(partes.join(" "));
    cache.set(p, t);
  }
  return t;
}
