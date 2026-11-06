import type { Metadata } from "next";
import { Suspense } from "react";
import { PostBrowser } from "@/components/PostBrowser";
import { getPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "Publicações" };

async function Lista() {
  return <PostBrowser posts={await getPosts()} />;
}

export default function Publicacoes() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Publicações</h1>
        <p>Tudo o que aconteceu nos encontros do projeto. Filtre pela frente ou pelas letras de Cristhaal.</p>
      </div>
      <Suspense fallback={<div className="count">Carregando publicações…</div>}>
        <Lista />
      </Suspense>
      <div style={{ height: 72 }} />
    </div>
  );
}
