"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/publicacoes", label: "Publicações" },
  { href: "/sobre", label: "Sobre" },
  { href: "/publicar", label: "Nova publicação", cta: true },
];

function Links({ path }: { path: string | null }) {
  return LINKS.map((l) => {
    const on = path !== null && (l.href === "/" ? path === "/" : path.startsWith(l.href));
    return (
      <Link key={l.href} href={l.href} className={l.cta ? "cta" : undefined} aria-current={on ? "page" : undefined}>
        {l.label}
      </Link>
    );
  });
}

export function NavLinks() {
  return <Links path={usePathname()} />;
}

/** Mesmos links sem marcar a página atual, usados enquanto o caminho ainda não é conhecido. */
export function NavLinksStatic() {
  return <Links path={null} />;
}
