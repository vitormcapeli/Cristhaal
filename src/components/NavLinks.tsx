"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/publicacoes", label: "Publicações" },
  { href: "/galeria", label: "Galeria" },
  { href: "/quem-somos", label: "Quem somos" },
];
// /publicar fica fora do menu: só a equipe publica e acessa pelo endereço direto (depois, pelo login).

function Links({ path }: { path: string | null }) {
  return LINKS.map((l) => {
    const on = path !== null && (l.href === "/" ? path === "/" : path.startsWith(l.href));
    return (
      <Link key={l.href} href={l.href} aria-current={on ? "page" : undefined}>
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
