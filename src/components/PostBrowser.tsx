"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AREA, AREAS, FRENTES, isAreaKey, isFrenteKey, type AreaKey, type FrenteKey } from "@/lib/data";
import { useAllPosts } from "@/lib/localPosts";
import { PostRow } from "./PostRow";

type FrenteFilter = FrenteKey | "todas";

/** Lista de publicações com busca, filtro por frente e pelas letras de CRISTHAAL. Os filtros ficam na URL. */
export function PostBrowser() {
  const params = useSearchParams();
  const [frente, setFrente] = useState<FrenteFilter>(() => {
    const f = params.get("frente");
    return f && isFrenteKey(f) ? f : "todas";
  });
  const [areas, setAreas] = useState<Set<AreaKey>>(() => new Set(params.getAll("area").filter(isAreaKey)));
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const all = useAllPosts();

  useEffect(() => {
    const u = new URLSearchParams();
    if (frente !== "todas") u.set("frente", frente);
    areas.forEach((a) => u.append("area", a));
    if (q.trim()) u.set("q", q.trim());
    const s = u.toString();
    window.history.replaceState(null, "", s ? `?${s}` : window.location.pathname);
  }, [frente, areas, q]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter(
      (p) =>
        (frente === "todas" || p.frente === frente) &&
        (!areas.size || p.areas.some((a) => areas.has(a))) &&
        (!term || `${p.titulo} ${p.resumo}`.toLowerCase().includes(term)),
    );
  }, [all, frente, areas, q]);

  const toggleArea = (k: AreaKey) =>
    setAreas((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const clear = () => { setFrente("todas"); setAreas(new Set()); setQ(""); };
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
          <input type="search" placeholder="Buscar por título ou assunto" value={q} onChange={(e) => setQ(e.target.value)} />
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
