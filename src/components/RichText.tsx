import type { CSSProperties, ReactNode } from "react";
import { imagemSegura, linkSeguro, youtubeId, type Doc, type Foto, type No } from "@/lib/doc";
import { validW } from "@/lib/rich";
import { Steps } from "./Steps";

// Mostra o texto de uma publicação (o documento do editor, já limpo por src/lib/doc.ts).
// Tudo é montado com componentes React, sem HTML cru: o que não for reconhecido simplesmente não aparece.

type Ctx = { color: string; inFeed?: boolean };

function Trecho({ n }: { n: No }) {
  let el: ReactNode = n.text;
  const marcas = n.marks ?? [];
  for (const m of marcas) {
    if (m.type === "bold") el = <strong>{el}</strong>;
    else if (m.type === "italic") el = <em>{el}</em>;
    else if (m.type === "highlight") el = <mark>{el}</mark>;
  }
  const link = marcas.find((m) => m.type === "link");
  const href = link && "attrs" in link ? linkSeguro(link.attrs.href) : null;
  if (href) {
    const fora = !href.startsWith("mailto:");
    el = <a href={href} {...(fora ? { target: "_blank", rel: "noopener noreferrer nofollow" } : null)}>{el}</a>;
  }
  return el;
}

function Inline({ nodes }: { nodes?: No[] }) {
  return (nodes ?? []).map((n, k) => (n.type === "hardBreak" ? <br key={k} /> : <Trecho key={k} n={n} />));
}

const alinhado = (n: No): CSSProperties | undefined => {
  const a = n.attrs?.textAlign;
  return a === "center" || a === "right" ? { textAlign: a } : undefined;
};

function Bloco({ n, ctx }: { n: No; ctx: Ctx }): ReactNode {
  const filhos = (n.content ?? []).map((c, k) => <Bloco key={k} n={c} ctx={ctx} />);
  switch (n.type) {
    case "paragraph":
      return <p style={alinhado(n)}><Inline nodes={n.content} /></p>;
    case "heading": {
      // No feed o título do post já é h3, então o subtítulo desce para h4.
      const H = ctx.inFeed ? "h4" : "h2";
      return <H className="prose-h2" style={alinhado(n)}><Inline nodes={n.content} /></H>;
    }
    case "bulletList":
      return <ul>{filhos}</ul>;
    case "orderedList":
      return <ol start={typeof n.attrs?.start === "number" ? n.attrs.start : undefined}>{filhos}</ol>;
    case "listItem":
      return <li>{filhos}</li>;
    case "blockquote":
      return <blockquote className="quote">{filhos}</blockquote>;
    case "callout":
      return <aside className="callout" data-tom={String(n.attrs?.tom ?? "nota")}>{filhos}</aside>;
    case "horizontalRule":
      return <hr className="divider" />;
    case "etapas":
      return <Steps color={ctx.color} />;
    case "figura": {
      const src = imagemSegura(n.attrs?.src);
      if (!src) return null;
      const w = validW(n.attrs?.w) ? (n.attrs.w as number) : null;
      const pos = n.attrs?.pos === "esquerda" || n.attrs?.pos === "direita" ? n.attrs.pos : undefined;
      const legenda = String(n.attrs?.legenda ?? "");
      return (
        <figure className="img-block" data-pos={pos} data-w={w ?? undefined} style={w ? ({ "--w": w } as CSSProperties) : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagens do Storage do portal */}
          <img src={src} alt={legenda} loading="lazy" />
          {legenda && <figcaption>{legenda}</figcaption>}
        </figure>
      );
    }
    case "galeria": {
      const fotos = ((n.attrs?.fotos as Foto[]) ?? []).filter((f) => imagemSegura(f.src));
      if (!fotos.length) return null;
      return (
        <div className="gal-block" data-n={Math.min(fotos.length, 4)}>
          {fotos.map((f, k) => (
            <figure key={k}>
              <a href={f.src} target="_blank" rel="noopener noreferrer" aria-label={f.legenda || `Abrir foto ${k + 1} em tamanho grande`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- imagens do Storage do portal */}
                <img src={f.src} alt={f.legenda ?? ""} loading="lazy" />
              </a>
              {f.legenda && <figcaption>{f.legenda}</figcaption>}
            </figure>
          ))}
        </div>
      );
    }
    case "video": {
      const id = youtubeId(n.attrs?.id);
      if (!id) return null;
      const legenda = String(n.attrs?.legenda ?? "");
      return (
        <figure className="video-block">
          <div className="video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`} title={legenda || "Vídeo do YouTube"} loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
            />
          </div>
          {legenda && <figcaption>{legenda}</figcaption>}
        </figure>
      );
    }
    default:
      return null;
  }
}

/** O texto de uma publicação. No feed os subtítulos descem de nível, porque o título já é h3. */
export function PostBody({ corpo, color, inFeed }: { corpo: Doc; color: string; inFeed?: boolean }) {
  const ctx = { color, inFeed };
  return (
    <div className="prose post-body" style={{ "--fc": color } as CSSProperties}>
      {corpo.content.map((n, k) => <Bloco key={k} n={n} ctx={ctx} />)}
    </div>
  );
}
