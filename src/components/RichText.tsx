import { Fragment } from "react";
import type { Bloco } from "@/lib/data";
import { parseInline } from "@/lib/rich";
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

/** O texto de uma publicação. No feed os subtítulos descem um nível, porque o título já é h3. */
export function PostBody({ corpo, color, inFeed }: { corpo: Bloco[]; color: string; inFeed?: boolean }) {
  const H = inFeed ? "h4" : "h2";
  return (
    <div className="prose" style={{ "--fc": color } as React.CSSProperties}>
      {corpo.map((b, k) => {
        if ("steps" in b) return <Steps key={k} color={color} />;
        if ("h" in b) return <H key={k} className="prose-h2">{b.h}</H>;
        if ("ul" in b) return <ul key={k}>{b.ul.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>;
        return <p key={k}><Inline text={b.p} /></p>;
      })}
    </div>
  );
}
