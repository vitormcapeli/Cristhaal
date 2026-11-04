import type { Metadata } from "next";
import { Composer } from "@/components/Composer";

export const metadata: Metadata = { title: "Nova publicação" };

export default function Publicar() {
  return (
    <div className="wrap">
      <div className="page-head">
        <h1>Nova publicação</h1>
        <p>Área da equipe. Por enquanto, o que você publicar fica salvo só neste navegador, para testar como o fluxo vai funcionar.</p>
      </div>
      <Composer />
    </div>
  );
}
