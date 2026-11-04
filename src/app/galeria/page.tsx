import type { Metadata } from "next";
import { Gallery } from "@/components/Gallery";

export const metadata: Metadata = { title: "Galeria" };

export default function Galeria() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Galeria</h1>
        <p>As fotos de todos os encontros, juntas. Toque numa foto para ler a publicação de onde ela veio.</p>
      </div>
      <Gallery />
      <div style={{ height: 72 }} />
    </div>
  );
}
