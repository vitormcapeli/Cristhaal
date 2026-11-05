import Link from "next/link";
import { INSTAGRAM, UNIFESP, YOUTUBE } from "@/lib/data";
import { InstagramIcon, YoutubeIcon } from "./Icons";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-brand">
          <Logo text={false} className="foot-logo" label="" />
          <p>Projeto de Extensão Universitária Cristhaal. Instituto de Ciência e Tecnologia da Unifesp, São José dos Campos.</p>
        </div>
        <a className="unifesp-plate small" href={UNIFESP} target="_blank" rel="noopener" aria-label="Unifesp, Universidade Federal de São Paulo">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo institucional fixo */}
          <img src="/unifesp.png" alt="" width={501} height={290} />
        </a>
        <div className="foot-links">
          <Link href="/publicacoes">Publicações</Link>
          <Link href="/galeria">Galeria</Link>
          <Link href="/quem-somos">Quem somos</Link>
          <a className="social" href={INSTAGRAM} target="_blank" rel="noopener"><InstagramIcon size={18} />Instagram</a>
          <a className="social" href={YOUTUBE} target="_blank" rel="noopener"><YoutubeIcon size={18} />YouTube</a>
        </div>
      </div>
    </footer>
  );
}
