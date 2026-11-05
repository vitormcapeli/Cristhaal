import type { Metadata } from "next";
import { Composer } from "@/components/Composer";

export const metadata: Metadata = { title: "Nova publicação" };

export default function Publicar() {
  return (
    <div className="wrap post compose">
      <div className="compose-head">
        <h1>Nova publicação</h1>
        <p>
          Escreva direto na página: ela já está do jeito que vai aparecer no portal. Clique na frente, no título, nas letras
          das áreas ou no texto para mudar. O rascunho fica salvo neste navegador.
        </p>
      </div>
      <Composer />
    </div>
  );
}
