import Link from "next/link";
import { INSTAGRAM } from "@/lib/data";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-brand">
          <Logo text={false} className="foot-logo" label="" />
          <p>Projeto de Extensão Universitária Cristhaal. Instituto de Ciência e Tecnologia da Unifesp, São José dos Campos.</p>
        </div>
        <div className="foot-links">
          <Link href="/publicacoes">Publicações</Link>
          <Link href="/galeria">Galeria</Link>
          <Link href="/quem-somos">Quem somos</Link>
          <a href={INSTAGRAM} target="_blank" rel="noopener">Instagram @projetocristhaal</a>
        </div>
      </div>
    </footer>
  );
}
