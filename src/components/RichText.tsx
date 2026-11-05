import { Fragment } from "react";
import type { Bloco } from "@/lib/data";
import { boxProps, parseInline } from "@/lib/rich";
import { Steps } from "./Steps";

export function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((s, k) => {
        let n: React.ReactNode = s.t;
        if (s.i) n = <em>{n}</em>;
        if (s.b) n = <strong>{n}</strong>;
        return <Fragment key={k}>{n}</Fragment>;
      })}
    </>
  );
}

/**
 * O texto de uma publicação. Cada bloco ocupa a coluna de texto, ou a largura escolhida no editor.
 * No feed os subtítulos descem um nível, porque o título já é h3.
 */
export function PostBody({ corpo, color, inFeed }: { corpo: Bloco[]; color: string; inFeed?: boolean }) {
  const H = inFeed ? "h4" : "h2";
  return (
    <div className="prose post-body" style={{ "--fc": color } as React.CSSProperties}>
      {corpo.map((b, k) => {
        const box = boxProps(b);
        if ("steps" in b) return <Steps key={k} color={color} box={box} />;
        if ("h" in b) return <H key={k} className="prose-h2" {...box}>{b.h}</H>;
        if ("ul" in b) return <ul key={k} {...box}>{b.ul.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>;
        if ("img" in b) {
          return (
            <figure key={k} className="img-block" {...box}>
              {/* eslint-disable-next-line @next/next/no-img-element -- imagens do próprio post */}
              <img src={b.img} alt="" loading="lazy" />
              {b.leg && <figcaption>{b.leg}</figcaption>}
            </figure>
          );
        }
        return <p key={k} {...box}><Inline text={b.p} /></p>;
      })}
    </div>
  );
}
