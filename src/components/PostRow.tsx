import Link from "next/link";
import { ViewTransition } from "react";
import { AREA, AUTHORS, FRENTES, fmtDate, type AreaKey, type Post } from "@/lib/data";
import { CrystalArt } from "./CrystalArt";

export function AreaLetters({ areas }: { areas: AreaKey[] }) {
  const list = areas.map((k) => AREA[k]).filter(Boolean);
  return (
    <span className="letters" aria-label={`Áreas: ${list.map((a) => a.n).join(", ")}`}>
      {list.map((a) => (
        <span key={a.k} className="lt" style={{ "--c": a.c } as React.CSSProperties} title={a.n}>{a.l}</span>
      ))}
    </span>
  );
}

export function Author({ autor, withRole }: { autor: Post["autor"]; withRole?: boolean }) {
  const A = AUTHORS[autor] ?? AUTHORS.equipe;
  return (
    <span className="who">
      <span className="av" style={{ "--ac": A.c } as React.CSSProperties}>{A.ini}</span>
      {A.nome}{withRole && `, ${A.papel.toLowerCase()}`}
    </span>
  );
}

export function FrenteTag({ frente }: { frente: Post["frente"] }) {
  const F = FRENTES[frente] ?? FRENTES.geral;
  return <span className="fr" style={{ "--fc": F.c } as React.CSSProperties}>{F.full}</span>;
}

export const thumbName = (id: string) => `post-${id}`;

/** Uma linha do feed. `preview` desenha sem link nem transição (usada na prévia do formulário). */
export function PostRow({ post: p, preview }: { post: Post; preview?: boolean }) {
  const F = FRENTES[p.frente] ?? FRENTES.geral;
  const nf = p.imagens?.length || p.fotos || 0;
  const thumb = p.imagens?.[0] ? (
    // eslint-disable-next-line @next/next/no-img-element -- fotos locais do protótipo (blob:)
    <img src={p.imagens[0]} alt="" />
  ) : (
    <CrystalArt seed={p.seed} color={F.c} w={264} h={184} />
  );
  const body = (
    <>
      <span className="thumb">
        {preview ? thumb : <ViewTransition name={thumbName(p.id)} share="morph" default="none">{thumb}</ViewTransition>}
      </span>
      <div>
        <h3>{p.titulo || "Título da publicação"}</h3>
        <p className="ex">{p.resumo}</p>
        <div className="meta">
          <FrenteTag frente={p.frente} />
          <Author autor={p.autor} />
          <time dateTime={p.data}>{fmtDate(p.data)}</time>
          <AreaLetters areas={p.areas} />
        </div>
      </div>
      <span className="photos">{nf} {nf === 1 ? "foto" : "fotos"}</span>
    </>
  );
  return preview ? <div className="row">{body}</div> : <Link className="row" href={`/publicacoes/${p.id}`}>{body}</Link>;
}
