import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./Logo";
import { NavLinks, NavLinksStatic } from "./NavLinks";

export function Header() {
  return (
    <header className="top">
      <div className="wrap">
        <Link className="brand" href="/" aria-label="Projeto Cristhaal, página inicial">
          <Logo text={false} className="brand-logo" label="" />
          <span className="bt">Projeto Cristhaal</span>
        </Link>
        <nav className="nav" aria-label="Principal">
          <Suspense fallback={<NavLinksStatic />}>
            <NavLinks />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
