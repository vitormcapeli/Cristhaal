"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConectado } from "@/lib/sessao";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/publicacoes", label: "Publicações" },
  { href: "/galeria", label: "Galeria" },
  { href: "/quem-somos", label: "Quem somos" },
];
// "Nova publicação" só aparece para quem entrou com a conta da equipe neste navegador.
// Para entrar, a equipe abre /publicar pelo endereço direto.

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
  const path = usePathname();
  const conectado = useConectado();
  return (
    <>
      <Links path={path} />
      {conectado && (
        <Link className="cta" href="/publicar" aria-current={path === "/publicar" ? "page" : undefined}>Nova publicação</Link>
      )}
    </>
  );
}

/** Mesmos links sem marcar a página atual, usados enquanto o caminho ainda não é conhecido. */
export function NavLinksStatic() {
  return <Links path={null} />;
}
