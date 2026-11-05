import type { Metadata } from "next";
import Link from "next/link";
import { CrystalArt } from "@/components/CrystalArt";

export const metadata: Metadata = { title: "Página não encontrada" };

/** 404 do portal: link quebrado, publicação removida ou endereço digitado errado. */
export default function NotFound() {
  return (
    <div className="wrap">
      <div className="cover" aria-hidden="true">
        <CrystalArt seed={404} color="#3D47B5" w={840} h={320} />
      </div>
      <div className="page-head">
        <h1>Esse cristal não está aqui.</h1>
        <p>A página que você procurou não existe ou foi removida. Talvez o link esteja quebrado ou o endereço tenha sido digitado errado.</p>
        <div className="hero-actions">
          <Link className="btn primary" href="/publicacoes">Ver publicações</Link>
          <Link className="btn" href="/">Ir para o início</Link>
        </div>
      </div>
      <div style={{ height: 72 }} />
    </div>
  );
}
