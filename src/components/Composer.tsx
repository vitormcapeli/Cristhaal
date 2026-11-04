"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AREAS, FRENTES, type AreaKey, type FrenteKey, type Post } from "@/lib/data";
import { addLocalPost } from "@/lib/localPosts";
import { PostRow } from "./PostRow";
import { useToast } from "./Toast";

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

/** Formulário de nova publicação com prévia ao vivo. Por enquanto salva só no navegador. */
export function Composer() {
  const router = useRouter();
  const toast = useToast();
  const [titulo, setTitulo] = useState("");
  const [frente, setFrente] = useState<FrenteKey>("educa");
  const [areas, setAreas] = useState<Set<AreaKey>>(() => new Set(["C"]));
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [erro, setErro] = useState("");
  const tituloRef = useRef<HTMLInputElement>(null);
  const textoRef = useRef<HTMLTextAreaElement>(null);
  // A data de hoje só é lida no navegador (no servidor a página é pré-renderizada uma vez só).
  const [hoje, setHoje] = useState("2026-01-01");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- data do navegador, só depois de montar
  useEffect(() => setHoje(new Date().toISOString().slice(0, 10)), []);

  const paras = texto.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const draft: Post = {
    id: "rascunho", frente, areas: [...areas], autor: "equipe", data: hoje,
    fotos: fotos.length, seed: titulo.length * 97 + 13, titulo: titulo.trim(),
    resumo: (paras[0] || "O começo do texto aparece aqui.").slice(0, 180), corpo: paras.map((p) => ({ p })), imagens: fotos,
  };

  const toggle = (k: AreaKey) =>
    setAreas((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.titulo) { setErro("Escreva um título para a publicação."); tituloRef.current?.focus(); return; }
    if (!draft.corpo.length) { setErro("Escreva o texto da publicação."); textoRef.current?.focus(); return; }
    if (!draft.areas.length) { setErro("Escolha pelo menos uma área."); return; }
    const id = `${slug(draft.titulo) || "publicacao"}-${Date.now().toString(36)}`;
    addLocalPost({ ...draft, id, imagens: undefined }, fotos);
    toast("Publicação publicada");
    router.push(`/publicacoes/${id}`);
  };

  return (
    <div className="composer">
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="fTitle">Título</label>
          <input ref={tituloRef} className="input" id="fTitle" required maxLength={120} placeholder="Ex.: Oficina de cristalização com a EE da região" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fFrente">Frente</label>
          <select className="input" id="fFrente" value={frente} onChange={(e) => setFrente(e.target.value as FrenteKey)}>
            {Object.entries(FRENTES).map(([k, f]) => <option key={k} value={k}>{f.full}</option>)}
          </select>
        </div>
        <fieldset className="field">
          <legend>Áreas</legend>
          <div className="word">
            {AREAS.map((a) => (
              <button key={a.k} className="wl" type="button" aria-pressed={areas.has(a.k)} aria-label={a.n} title={a.n} onClick={() => toggle(a.k)} style={{ "--c": a.c } as React.CSSProperties}>
                {a.l}
              </button>
            ))}
          </div>
          <span className="help">Escolha uma ou mais letras.</span>
        </fieldset>
        <div className="field">
          <label htmlFor="fBody">Texto</label>
          <textarea ref={textoRef} className="input" id="fBody" required placeholder="Conte como foi o encontro: quem participou, o que foi feito, o que os estudantes descobriram." value={texto} onChange={(e) => setTexto(e.target.value)} />
          <span className="help">Deixe uma linha em branco entre parágrafos.</span>
        </div>
        <div className="field">
          <label htmlFor="fPhotos">Fotos</label>
          <input className="input" id="fPhotos" type="file" accept="image/*" multiple onChange={(e) => setFotos([...(e.target.files ?? [])].map((f) => URL.createObjectURL(f)))} />
          <span className="help">As fotos aparecem na galeria da publicação.</span>
        </div>
        <p className="help form-error" role="alert">{erro}</p>
        <button className="btn primary" type="submit">Publicar</button>
      </form>
      <div className="preview-box">
        <small>Prévia na lista de publicações</small>
        <div className="feed"><PostRow post={draft} preview /></div>
      </div>
    </div>
  );
}
