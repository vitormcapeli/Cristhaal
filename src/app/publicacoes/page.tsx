import type { Metadata } from "next";
import { Suspense } from "react";
import { PostBrowser } from "@/components/PostBrowser";

export const metadata: Metadata = { title: "Publicações" };

export default function Publicacoes() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Publicações</h1>
        <p>Tudo o que aconteceu nos encontros do projeto. Filtre pela frente ou pelas letras de Cristhaal.</p>
      </div>
      <Suspense fallback={<div className="count">Carregando publicações…</div>}>
        <PostBrowser />
      </Suspense>
      <div style={{ height: 72 }} />
    </div>
  );
}
