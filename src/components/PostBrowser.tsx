"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AREA, AREAS, FRENTES, isAreaKey, isFrenteKey, type AreaKey, type FrenteKey } from "@/lib/data";
import { useAllPosts } from "@/lib/localPosts";
import { semAcento, textoBusca } from "@/lib/search";
import { PostRow } from "./PostRow";

type FrenteFilter = FrenteKey | "todas";
/** Espera (ms) depois da última mudança nos filtros antes de gravar na URL. */
const URL_DELAY = 300;
type Params = { get(k: string): string | null; getAll(k: string): string[] };

const lerFrente = (p: Params): FrenteFilter => {
  const f = p.get("frente");
  return f && isFrenteKey(f) ? f : "todas";
};
const lerAreas = (p: Params) => new Set(p.getAll("area").filter(isAreaKey));

/** Os filtros como query da URL, sempre na mesma ordem. */
function paraQuery(frente: FrenteFilter, areas: Set<AreaKey>, q: string) {
  const u = new URLSearchParams();
  if (frente !== "todas") u.set("frente", frente);
  areas.forEach((a) => u.append("area", a));
  if (q.trim()) u.set("q", q.trim());
  return u.toString();
}

/** Lista de publicações com busca, filtro por frente e pelas letras de CRISTHAAL. Os filtros ficam na URL. */
export function PostBrowser() {
  const params = useSearchParams();
  const urlKey = params.toString();
  const [frente, setFrente] = useState<FrenteFilter>(() => lerFrente(params));
  const [areas, setAreas] = useState<Set<AreaKey>>(() => lerAreas(params));
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const all = useAllPosts();
  // O campo de busca não é controlado: o que a pessoa digita nunca é sobrescrito por uma renderização atrasada.
  const inputRef = useRef<HTMLInputElement>(null);

  // Queries que este componente escreveu na URL e que o Next ainda não devolveu em `params`.
  // Uma query fora dessa fila veio de fora (link do menu, link de uma letra, Voltar/Avançar).
  const escrito = useRef(urlKey);
  const pendentes = useRef<string[]>([]);
  const visto = useRef(urlKey);
  const stateKey = paraQuery(frente, areas, q);

  // Cada replaceState vira uma transição do roteador do Next. Escrever a cada tecla disputava com a
  // digitação e fazia letras sumirem; por isso a URL só é atualizada quando a pessoa para de digitar.
  useEffect(() => {
    if (stateKey === escrito.current) return;
    const t = window.setTimeout(() => {
      escrito.current = stateKey;
      pendentes.current.push(stateKey);
      window.history.replaceState(null, "", stateKey ? `?${stateKey}` : window.location.pathname);
    }, URL_DELAY);
    return () => window.clearTimeout(t);
  }, [stateKey]);

  useEffect(() => {
    if (urlKey === visto.current) return;
    visto.current = urlKey;
    const i = pendentes.current.indexOf(urlKey);
    if (i >= 0) { pendentes.current.splice(0, i + 1); return; }
    // Navegação externa: os filtros passam a seguir a URL.
    pendentes.current = [];
    escrito.current = urlKey;
    setFrente(lerFrente(params));
    setAreas(lerAreas(params));
    const nq = params.get("q") ?? "";
    setQ(nq);
    if (inputRef.current) inputRef.current.value = nq;
  }, [urlKey, params]);

  const list = useMemo(() => {
    const term = semAcento(q.trim());
    return all.filter(
      (p) =>
        (frente === "todas" || p.frente === frente) &&
        (!areas.size || p.areas.some((a) => areas.has(a))) &&
        (!term || textoBusca(p).includes(term)),
    );
  }, [all, frente, areas, q]);

  const toggleArea = (k: AreaKey) =>
    setAreas((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const clear = () => {
    setFrente("todas");
    setAreas(new Set());
    setQ("");
    if (inputRef.current) inputRef.current.value = "";
  };
  const selected = [...areas].map((k) => AREA[k].n);
  const chips: [FrenteFilter, string, string | null][] = [["todas", "Todas", null], ...Object.entries(FRENTES).map(([k, f]) => [k as FrenteKey, f.nome, f.c] as [FrenteKey, string, string])];

  return (
    <>
      <div className="filters">
        <label className="search">
          <span className="sr">Buscar publicações</span>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <input type="search" placeholder="Buscar por título, assunto ou trecho do texto" ref={inputRef} defaultValue={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por frente">
          {chips.map(([k, n, c]) => (
            <button key={k} className="chip" type="button" aria-pressed={frente === k} onClick={() => setFrente(k)} style={c ? ({ "--fc": c } as React.CSSProperties) : undefined}>
              {c && <i />}{n}
            </button>
          ))}
        </div>
        <div>
          <div className="word" role="group" aria-label="Filtrar por área">
            {AREAS.map((a) => (
              <button key={a.k} className="wl" type="button" aria-pressed={areas.has(a.k)} aria-label={a.n} title={a.n} onClick={() => toggleArea(a.k)} style={{ "--c": a.c } as React.CSSProperties}>
                {a.l}
              </button>
            ))}
          </div>
          <div className="word-label" aria-live="polite">
            {selected.length ? `Mostrando: ${selected.join(", ")}` : "Toque nas letras para filtrar por área"}
          </div>
        </div>
      </div>
      <div className="count" aria-live="polite">{list.length} {list.length === 1 ? "publicação" : "publicações"}</div>
      <div className="feed">
        {list.length ? (
          list.map((p) => <PostRow key={p.id} post={p} />)
        ) : (
          <div className="empty">
            <p>Nenhuma publicação com esses filtros.</p>
            <button className="btn small" type="button" onClick={clear}>Limpar filtros</button>
          </div>
        )}
      </div>
    </>
  );
}
