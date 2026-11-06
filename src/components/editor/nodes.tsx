"use client";

// Blocos próprios do portal no editor Tiptap: imagem com legenda, galeria, vídeo do YouTube,
// etapas do experimento e caixa de destaque. O que cada um guarda é o mesmo que src/lib/doc.ts
// aceita e src/components/RichText.tsx mostra.

import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { useId, useState } from "react";
import { youtubeId, type Foto, type Pos } from "@/lib/doc";
import { arquivosParaImagens } from "@/lib/imagem";
import { W_MIN } from "@/lib/rich";
import { PhotoIcon } from "../Icons";
import { Steps } from "../Steps";

/** Atributo guardado no nó mas desenhado à mão no renderHTML. */
const attr = (def: unknown) => ({ default: def, rendered: false });

/** Largura da coluna de texto, igual a --col no CSS. */
const COL_REM = 42;
const colunaPx = (el: HTMLElement) => Math.min(el.clientWidth, COL_REM * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16));

// Imagem ------------------------------------------------------------------------------------------

const POS_NOME: Record<Pos, string> = { esquerda: "À esquerda, texto ao lado", centro: "No centro", direita: "À direita, texto ao lado" };
const TAMANHOS: Record<"centro" | "lado", [string, number | null][]> = {
  centro: [["Coluna", null], ["Larga", 80], ["Inteira", 100]],
  lado: [["Menor", 35], ["Maior", 50]],
};

function FiguraView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const { src, legenda, w, pos } = node.attrs as { src: string; legenda: string; w: number | null; pos: Pos };
  const [rotulo, setRotulo] = useState<string | null>(null);
  const lado = pos !== "centro";

  const redimensionar = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const btn = e.currentTarget;
    const fig = btn.closest("figure")!;
    const area = editor.view.dom as HTMLElement;
    btn.setPointerCapture(e.pointerId);
    const r = area.getBoundingClientRect();
    const f = fig.getBoundingClientRect();
    const col = colunaPx(area);
    const move = (ev: PointerEvent) => {
      let pct: number;
      if (pos === "centro") pct = ((2 * Math.abs(ev.clientX - (r.left + r.width / 2))) / r.width) * 100;
      else pct = ((pos === "esquerda" ? ev.clientX - f.left : f.right - ev.clientX) / col) * 100;
      let nw: number | null = Math.round(Math.max(W_MIN, Math.min(100, pct)) / 5) * 5;
      // No centro, perto da largura da coluna volta ao padrão.
      if (pos === "centro" && Math.abs(pct - (col / r.width) * 100) < 3) nw = null;
      updateAttributes({ w: nw });
      setRotulo(nw === null ? "Coluna do texto" : lado ? `${nw}% da coluna` : nw === 100 ? "Largura inteira" : `${nw}% da largura`);
    };
    const up = () => {
      btn.removeEventListener("pointermove", move);
      btn.removeEventListener("pointerup", up);
      btn.removeEventListener("pointercancel", up);
      setRotulo(null);
    };
    btn.addEventListener("pointermove", move);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
  };

  const mudarPos = (p: Pos) => updateAttributes({ pos: p, w: p === "centro" ? (lado ? null : w) : lado ? w : 45 });

  return (
    <NodeViewWrapper
      as="figure" className={`img-block${selected ? " is-sel" : ""}`} data-pos={lado ? pos : undefined} data-w={w ?? undefined}
      style={w ? ({ "--w": w } as React.CSSProperties) : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem do rascunho */}
      <img src={src} alt={legenda} draggable={false} data-drag-handle />
      <input
        className="img-leg" type="text" maxLength={300} placeholder="Escreva uma legenda (opcional)" aria-label="Legenda da imagem"
        value={legenda} onChange={(e) => updateAttributes({ legenda: e.target.value })}
      />
      <div className="media-tools" contentEditable={false} role="toolbar" aria-label="Ajustes da imagem">
        {(["esquerda", "centro", "direita"] as Pos[]).map((p) => (
          <button key={p} type="button" aria-pressed={pos === p} title={POS_NOME[p]} aria-label={POS_NOME[p]} onClick={() => mudarPos(p)}>
            <PosIcon pos={p} />
          </button>
        ))}
        <span className="mt-sep" />
        {TAMANHOS[lado ? "lado" : "centro"].map(([nome, v]) => (
          <button key={nome} type="button" aria-pressed={(w ?? null) === v || (lado && w === null && v === 35)} onClick={() => updateAttributes({ w: v })}>{nome}</button>
        ))}
        <span className="mt-sep" />
        <button type="button" onClick={deleteNode}>Remover</button>
      </div>
      <button
        type="button" className="media-resize" data-side={pos === "direita" ? "l" : "r"} onPointerDown={redimensionar}
        title="Arraste para mudar o tamanho" aria-label="Tamanho da imagem"
        onKeyDown={(e) => {
          const d = e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0;
          if (!d) return;
          e.preventDefault();
          updateAttributes({ w: Math.max(W_MIN, Math.min(100, (w ?? (lado ? 45 : 60)) + (pos === "direita" ? -d : d))) });
        }}
      />
      {rotulo && <span className="resize-label media-label">{rotulo}</span>}
    </NodeViewWrapper>
  );
}

function PosIcon({ pos }: { pos: Pos }) {
  const img = pos === "esquerda" ? 3 : pos === "direita" ? 13 : 7;
  const linhas = pos === "centro" ? [] : pos === "esquerda" ? [12, 21] : [3, 11];
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x={img} y={pos === "centro" ? 5 : 4} width={pos === "centro" ? 10 : 8} height={pos === "centro" ? 9 : 8} rx="1.5" fill="currentColor" />
      {pos === "centro" ? <path d="M4 18h16M7 21h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : (
        <path d={`M${linhas[0]} 5h${linhas[1] - linhas[0]}M${linhas[0]} 9h${linhas[1] - linhas[0]}M3 14h18M3 19h18`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export const Figura = Node.create({
  name: "figura",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ src: attr(null), legenda: attr(""), w: attr(null), pos: attr("centro") }),
  parseHTML: () => [{
    tag: "figure[data-figura]",
    getAttrs: (el) => ({
      src: el.querySelector("img")?.getAttribute("src") ?? null,
      legenda: el.querySelector("figcaption")?.textContent ?? "",
      w: Number(el.getAttribute("data-w")) || null,
      pos: el.getAttribute("data-pos") || "centro",
    }),
  }],
  renderHTML: ({ node }) => [
    "figure", { "data-figura": "", "data-pos": node.attrs.pos, ...(node.attrs.w ? { "data-w": node.attrs.w } : null) },
    ["img", { src: node.attrs.src }], ["figcaption", {}, node.attrs.legenda || ""],
  ],
  addNodeView: () => ReactNodeViewRenderer(FiguraView),
});

// Galeria -----------------------------------------------------------------------------------------

function GaleriaView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const fotos = (node.attrs.fotos as Foto[]) ?? [];
  const mudar = (novas: Foto[]) => (novas.length ? updateAttributes({ fotos: novas }) : deleteNode());
  const add = async (files: FileList | null) => {
    const urls = await arquivosParaImagens(files ?? []);
    if (urls.length) mudar([...fotos, ...urls.map((src) => ({ src, legenda: "" }))].slice(0, 12));
  };
  return (
    <NodeViewWrapper className={`gal-block${selected ? " is-sel" : ""}`} data-n={Math.min(fotos.length + (fotos.length < 12 ? 1 : 0), 4)}>
      {fotos.map((f, k) => (
        <figure key={k}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem do rascunho */}
          <img src={f.src} alt={f.legenda ?? ""} draggable={false} data-drag-handle />
          <input
            className="img-leg" type="text" maxLength={300} placeholder="Legenda" aria-label={`Legenda da foto ${k + 1}`}
            value={f.legenda ?? ""} onChange={(e) => mudar(fotos.map((x, j) => (j === k ? { ...x, legenda: e.target.value } : x)))}
          />
          <button className="ph-x" type="button" aria-label={`Tirar a foto ${k + 1} da galeria`} onClick={() => mudar(fotos.filter((_, j) => j !== k))}>×</button>
        </figure>
      ))}
      {fotos.length < 12 && (
        <label className="add-tile" contentEditable={false}>
          <PhotoIcon size={26} />Mais fotos
          <input className="file-hidden" type="file" accept="image/*" multiple onChange={(e) => { void add(e.target.files); e.target.value = ""; }} />
        </label>
      )}
      <div className="media-tools" contentEditable={false}>
        <span className="mt-info">Galeria · {fotos.length} {fotos.length === 1 ? "foto" : "fotos"}</span>
        <span className="mt-sep" />
        <button type="button" onClick={deleteNode}>Remover galeria</button>
      </div>
    </NodeViewWrapper>
  );
}

export const Galeria = Node.create({
  name: "galeria",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ fotos: attr([]) }),
  parseHTML: () => [{
    tag: "div[data-galeria]",
    getAttrs: (el) => ({
      fotos: [...el.querySelectorAll("figure")].map((f) => ({ src: f.querySelector("img")?.getAttribute("src") ?? "", legenda: f.querySelector("figcaption")?.textContent ?? "" })),
    }),
  }],
  renderHTML: ({ node }) => [
    "div", { "data-galeria": "" },
    ...(node.attrs.fotos as Foto[]).map((f) => ["figure", {}, ["img", { src: f.src }], ["figcaption", {}, f.legenda ?? ""]]),
  ],
  addNodeView: () => ReactNodeViewRenderer(GaleriaView),
});

// Vídeo -------------------------------------------------------------------------------------------

function VideoView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { id, legenda } = node.attrs as { id: string | null; legenda: string };
  const [link, setLink] = useState("");
  const [erro, setErro] = useState(false);
  const campo = useId();
  const pronto = () => {
    const v = youtubeId(link);
    setErro(!v);
    if (v) updateAttributes({ id: v });
  };
  if (!id) {
    return (
      <NodeViewWrapper className={`video-block video-novo${selected ? " is-sel" : ""}`}>
        <div className="video-form" contentEditable={false}>
          <label htmlFor={campo}><b>Vídeo do YouTube</b> Cole o link do vídeo (do navegador ou do botão Compartilhar).</label>
          <div className="video-row">
            <input
              id={campo} className="input" type="url" placeholder="https://www.youtube.com/watch?v=…" value={link} autoFocus
              onChange={(e) => { setLink(e.target.value); setErro(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pronto(); } if (e.key === "Escape") deleteNode(); }}
            />
            <button className="btn small primary" type="button" onClick={pronto}>Pôr vídeo</button>
            <button className="btn small" type="button" onClick={deleteNode}>Cancelar</button>
          </div>
          {erro && <p className="form-error">Esse link não parece ser de um vídeo do YouTube.</p>}
        </div>
      </NodeViewWrapper>
    );
  }
  return (
    <NodeViewWrapper as="figure" className={`video-block${selected ? " is-sel" : ""}`}>
      <div className="video-frame video-capa" data-drag-handle>
        {/* eslint-disable-next-line @next/next/no-img-element -- miniatura do YouTube, só no editor */}
        <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" draggable={false} />
        <span className="video-play" aria-hidden="true" />
      </div>
      <input
        className="img-leg" type="text" maxLength={300} placeholder="Escreva uma legenda (opcional)" aria-label="Legenda do vídeo"
        value={legenda} onChange={(e) => updateAttributes({ legenda: e.target.value })}
      />
      <div className="media-tools" contentEditable={false}>
        <span className="mt-info">Vídeo do YouTube</span>
        <span className="mt-sep" />
        <button type="button" onClick={() => updateAttributes({ id: null })}>Trocar</button>
        <button type="button" onClick={deleteNode}>Remover</button>
      </div>
    </NodeViewWrapper>
  );
}

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes: () => ({ id: attr(null), legenda: attr("") }),
  parseHTML: () => [{
    tag: "figure[data-video]",
    getAttrs: (el) => ({ id: youtubeId(el.getAttribute("data-video")), legenda: el.querySelector("figcaption")?.textContent ?? "" }),
  }],
  renderHTML: ({ node }) => ["figure", { "data-video": node.attrs.id ?? "" }, ["figcaption", {}, node.attrs.legenda || ""]],
  addNodeView: () => ReactNodeViewRenderer(VideoView),
});

// Etapas ------------------------------------------------------------------------------------------

function EtapasView({ deleteNode, selected }: NodeViewProps) {
  return (
    <NodeViewWrapper className={`steps-embed${selected ? " is-sel" : ""}`} data-drag-handle>
      <Steps />
      <div className="media-tools" contentEditable={false}>
        <span className="mt-info">Etapas do experimento</span>
        <span className="mt-sep" />
        <button type="button" onClick={deleteNode}>Remover</button>
      </div>
    </NodeViewWrapper>
  );
}

export const Etapas = Node.create({
  name: "etapas",
  group: "block",
  atom: true,
  draggable: true,
  parseHTML: () => [{ tag: "div[data-etapas]" }],
  renderHTML: () => ["div", { "data-etapas": "" }],
  addNodeView: () => ReactNodeViewRenderer(EtapasView),
});

// Destaque ----------------------------------------------------------------------------------------

export const Destaque = Node.create({
  name: "callout",
  group: "block",
  content: "(paragraph | heading | bulletList | orderedList)+",
  defining: true,
  addAttributes: () => ({
    tom: { default: "nota", parseHTML: (el) => el.getAttribute("data-tom") || "nota", renderHTML: (a) => ({ "data-tom": a.tom }) },
  }),
  parseHTML: () => [{ tag: "aside[data-callout]" }],
  renderHTML: ({ HTMLAttributes }) => ["aside", mergeAttributes({ class: "callout", "data-callout": "" }, HTMLAttributes), 0],
});

/**
 * Enter numa linha vazia no fim de uma citação ou de um destaque sai dele, como nas listas.
 * Sem isso não haveria como continuar escrevendo depois.
 */
export const SairDoBloco = Extension.create({
  name: "sairDoBloco",
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { $from, empty } = this.editor.state.selection;
        if (!empty || $from.parent.type.name !== "paragraph" || $from.parent.content.size) return false;
        const d = $from.depth - 1;
        const pai = $from.node(d);
        if (d < 1 || !["callout", "blockquote"].includes(pai.type.name) || $from.index(d) !== pai.childCount - 1) return false;
        return this.editor.commands.lift(pai.type.name);
      },
    };
  },
});
