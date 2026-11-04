"use client";

import Link from "next/link";
import { FRENTES, fmtDate } from "@/lib/data";
import { useAllPosts } from "@/lib/localPosts";
import { CrystalArt } from "./CrystalArt";
import { FrenteTag } from "./PostRow";

/** Todas as fotos das publicações, agrupadas pelo encontro de onde vieram (mais recentes primeiro). */
export function Gallery() {
  const posts = useAllPosts().filter((p) => (p.imagens?.length || p.fotos) > 0);
  const total = posts.reduce((n, p) => n + (p.imagens?.length || p.fotos), 0);
  return (
    <>
      <div className="count">{total} fotos de {posts.length} encontros</div>
      <div className="galeria">
        {posts.map((p) => {
          const F = FRENTES[p.frente] ?? FRENTES.geral;
          const urls = p.imagens ?? [];
          const nf = urls.length || p.fotos;
          const href = `/publicacoes/${p.id}`;
          return (
            <section key={p.id} className="galeria-grupo" aria-labelledby={`g-${p.id}`}>
              <div className="galeria-head">
                <h2 id={`g-${p.id}`}><Link href={href}>{p.titulo}</Link></h2>
                <div className="meta"><FrenteTag frente={p.frente} /><time dateTime={p.data}>{fmtDate(p.data)}</time></div>
              </div>
              <div className="gallery">
                {Array.from({ length: nf }, (_, k) => (
                  <figure key={k}>
                    <Link href={href} aria-label={`Foto ${k + 1} de ${p.titulo}`}>
                      {urls[k] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={urls[k]} alt="" />
                      ) : (
                        <CrystalArt seed={p.seed * 31 + k * 7} color={F.c} w={320} h={240} />
                      )}
                    </Link>
                    {!urls[k] && <figcaption>Espaço para foto {k + 1}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
