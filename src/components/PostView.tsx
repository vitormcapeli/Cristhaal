import Link from "next/link";
import { ViewTransition } from "react";
import { FRENTES, fmtDate, type Post } from "@/lib/data";
import { CrystalArt } from "./CrystalArt";
import { AreaLetters, Author, FrenteTag, thumbName } from "./PostRow";
import { PostBody } from "./RichText";

/** Fotos que aparecem por publicação no feed da página inicial; o resto fica na página do post. */
const FEED_PHOTOS = 4;

type ArticleProps = { post: Post; inFeed?: boolean };

/**
 * Publicação completa. Na página do post é a peça principal; no feed da página inicial (`inFeed`)
 * o título vira link e a galeria mostra só as primeiras fotos.
 */
export function PostArticle({ post: p, inFeed }: ArticleProps) {
  const F = FRENTES[p.frente] ?? FRENTES.geral;
  const href = `/publicacoes/${p.id}`;
  const urls = p.imagens ?? [];
  const nf = urls.length || p.fotos || 0;
  const shown = inFeed ? Math.min(nf, FEED_PHOTOS) : nf;
  const hidden = nf - shown;
  const Title = inFeed ? "h3" : "h1";

  const cover = urls[0] ? (
    // eslint-disable-next-line @next/next/no-img-element -- fotos locais do protótipo (blob:)
    <img src={urls[0]} alt="" />
  ) : (
    <CrystalArt seed={p.seed} color={F.c} w={840} h={320} />
  );

  return (
    <article className={inFeed ? "post-full in-feed" : "post-full"}>
      <div className="post-head">
        <FrenteTag frente={p.frente} />
        <Title>{inFeed ? <Link href={href}>{p.titulo}</Link> : p.titulo}</Title>
        <div className="meta">
          <Author autor={p.autor} withRole />
          <time dateTime={p.data}>{fmtDate(p.data)}</time>
          <AreaLetters areas={p.areas} />
        </div>
      </div>
      <div className="cover">
        <ViewTransition name={thumbName(p.id)} share="morph" default="none">{cover}</ViewTransition>
      </div>
      <PostBody corpo={p.corpo} color={F.c} inFeed={inFeed} />
      {nf > 0 && (
        <>
          {inFeed ? <h4 className="gallery-title">Fotos do encontro</h4> : <h2 className="gallery-title">Fotos do encontro</h2>}
          <div className="gallery">
            {Array.from({ length: shown }, (_, k) => {
              const more = inFeed && hidden > 0 && k === shown - 1;
              const img = urls[k] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={urls[k]} alt={`Foto ${k + 1} da publicação`} />
              ) : (
                <CrystalArt seed={p.seed * 31 + k * 7} color={F.c} w={320} h={240} />
              );
              return (
                <figure key={k}>
                  {img}
                  {more ? (
                    <Link className="more-photos" href={href}>+{hidden + 1} fotos</Link>
                  ) : (
                    !urls[k] && <figcaption>Espaço para foto {k + 1}</figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        </>
      )}
    </article>
  );
}

type Props = { post: Post; prev?: Post; next?: Post };

export function PostView({ post, prev, next }: Props) {
  return (
    <div className="wrap post">
      <Link className="back" href="/publicacoes">Voltar para publicações</Link>
      <PostArticle post={post} />
      <nav className="pn" aria-label="Outras publicações">
        {prev ? <Link href={`/publicacoes/${prev.id}`}><small>Anterior</small><b>{prev.titulo}</b></Link> : <span />}
        {next ? <Link className="next" href={`/publicacoes/${next.id}`}><small>Próxima</small><b>{next.titulo}</b></Link> : <span />}
      </nav>
    </div>
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
