import type { Post } from "./data";
import { textoDoDoc } from "./doc";

/** Minúsculas e sem acentos: "História" e "historia" viram a mesma coisa. */
export const semAcento = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const cache = new WeakMap<Post, string>();

/** Tudo o que a busca olha num post: título, resumo, todo o texto e as legendas. */
export function textoBusca(p: Post): string {
  let t = cache.get(p);
  if (t === undefined) {
    t = semAcento(`${p.titulo} ${p.resumo} ${textoDoDoc(p.corpo)}`);
    cache.set(p, t);
  }
  return t;
}
