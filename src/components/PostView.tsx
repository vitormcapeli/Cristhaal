import Link from "next/link";
import { ViewTransition } from "react";
import { FRENTES, fmtDate, type Post } from "@/lib/data";
import { CrystalArt } from "./CrystalArt";
import { AreaLetters, Author, FrenteTag, thumbName } from "./PostRow";
import { Steps } from "./Steps";

type Props = { post: Post; prev?: Post; next?: Post };

export function PostView({ post: p, prev, next }: Props) {
  const F = FRENTES[p.frente] ?? FRENTES.geral;
  const urls = p.imagens ?? [];
  const nf = urls.length || p.fotos || 0;
  return (
    <article className="wrap post">
      <Link className="back" href="/publicacoes">Voltar para publicações</Link>
      <div className="post-head">
        <FrenteTag frente={p.frente} />
        <h1>{p.titulo}</h1>
        <div className="meta">
          <Author autor={p.autor} withRole />
          <time dateTime={p.data}>{fmtDate(p.data)}</time>
          <AreaLetters areas={p.areas} />
        </div>
      </div>
      <div className="cover">
        <ViewTransition name={thumbName(p.id)} share="morph" default="none">
          {urls[0] ? (
            // eslint-disable-next-line @next/next/no-img-element -- fotos locais do protótipo (blob:)
            <img src={urls[0]} alt="" />
          ) : (
            <CrystalArt seed={p.seed} color={F.c} w={840} h={320} />
          )}
        </ViewTransition>
      </div>
      <div className="prose">
        {p.corpo.map((b, i) => ("steps" in b ? <Steps key={i} color={F.c} /> : <p key={i}>{b.p}</p>))}
      </div>
      {nf > 0 && (
        <>
          <h2 className="gallery-title">Fotos do encontro</h2>
          <div className="gallery">
            {Array.from({ length: nf }, (_, k) => (
              <figure key={k}>
                {urls[k] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls[k]} alt={`Foto ${k + 1} da publicação`} />
                ) : (
                  <>
                    <CrystalArt seed={p.seed * 31 + k * 7} color={F.c} w={320} h={240} />
                    <figcaption>Espaço para foto {k + 1}</figcaption>
                  </>
                )}
              </figure>
            ))}
          </div>
        </>
      )}
      <nav className="pn" aria-label="Outras publicações">
        {prev ? <Link href={`/publicacoes/${prev.id}`}><small>Anterior</small><b>{prev.titulo}</b></Link> : <span />}
        {next ? <Link className="next" href={`/publicacoes/${next.id}`}><small>Próxima</small><b>{next.titulo}</b></Link> : <span />}
      </nav>
    </article>
  );
}

export function PostNotFound() {
  return (
    <div className="wrap post">
      <Link className="back" href="/publicacoes">Voltar para publicações</Link>
      <h1>Esta publicação não existe mais.</h1>
      <p>Ela pode ter sido removida. Veja as outras na lista de publicações.</p>
    </div>
  );
}
