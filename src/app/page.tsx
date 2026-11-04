import Link from "next/link";
import { CrystalArt } from "@/components/CrystalArt";
import { LatestFeed } from "@/components/Feeds";
import { HeroLogo } from "@/components/HeroLogo";
import { Steps } from "@/components/Steps";
import { AREA, FRENTES, type AreaKey, type FrenteKey } from "@/lib/data";

// "Ciência para o Reencontro Interdisciplinar da Sociedade com a Tecnologia, a História, o Ambiente e a Arte nas suas Linguagens."
const SIGLA: (string | AreaKey)[] = ["C", " para o ", "R", " ", "I", " da ", "S", " com a ", "T", ", a ", "H", ", o ", "A1", " e a ", "A2", " nas suas ", "L", "."];

export default function Home() {
  return (
    <>
      <div className="wrap hero">
        <HeroLogo />
        <div className="hero-copy">
          <h1>Cristais estão em quase tudo. A gente ajuda a enxergá-los.</h1>
          <p>
            O Cristhaal é um projeto de extensão do ICT/Unifesp em São José dos Campos que aproxima estudantes de escolas públicas da
            ciência, na sala de aula, no laboratório e nas histórias de quem faz ciência.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" href="/publicacoes">Ver publicações</Link>
            <a className="btn" href="#frentes">Conhecer as frentes</a>
          </div>
        </div>
      </div>

      <div className="sigla">
        <div className="wrap">
          <h2 className="sr">O que significa Cristhaal</h2>
          <p className="sigla-text">
            {SIGLA.map((part, i) => {
              const a = AREA[part as AreaKey];
              if (!a || part.length > 2) return <span key={i}>{part}</span>;
              return (
                <span key={i} style={{ whiteSpace: "nowrap" }}>
                  <Link className="ini" href={`/publicacoes?area=${a.k}`} style={{ "--c": a.c } as React.CSSProperties} aria-label={`Ver publicações de ${a.n}`}>
                    {a.l}
                  </Link>
                  {a.rest}
                </span>
              );
            })}
          </p>
          <p className="sigla-hint">Cada letra colorida é uma área do projeto. Toque numa delas para ver as publicações sobre ela.</p>
        </div>
      </div>

      <section className="sec" id="frentes" aria-labelledby="frentesTitle">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 id="frentesTitle">Três frentes, um mesmo brilho</h2>
              <p>O projeto acontece em três frentes que se completam: levar a universidade até a escola, trazer a escola para o laboratório e mostrar quem fez essa história.</p>
            </div>
          </div>
          <div className="frentes">
            {(["educa", "experimenta", "inspira"] as FrenteKey[]).map((k) => {
              const F = FRENTES[k];
              return (
                <article key={k} className="frente" style={{ "--fc": F.c } as React.CSSProperties}>
                  <CrystalArt seed={F.seed} color={F.c} w={400} h={150} />
                  <div className="frente-body">
                    <h3>Cristhaal <span>{F.nome}</span></h3>
                    <p>{F.text}</p>
                    {k === "experimenta" && <Steps />}
                    <Link className="btn small" href={`/publicacoes?frente=${k}`}>Ver publicações da frente</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec" aria-labelledby="ultimasTitle" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <div>
              <h2 id="ultimasTitle">Últimas publicações</h2>
              <p>Os relatos mais recentes dos encontros, visitas e oficinas, escritos pela equipe.</p>
            </div>
            <Link className="btn small" href="/publicacoes">Ver todas</Link>
          </div>
          <LatestFeed />
        </div>
      </section>
    </>
  );
}
