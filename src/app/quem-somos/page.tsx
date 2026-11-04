import type { Metadata } from "next";
import { AREAS, COORDENACAO, INSTAGRAM } from "@/lib/data";

export const metadata: Metadata = { title: "Quem somos" };

// Tirados da descrição do projeto e das apresentações das frentes no Instagram.
const OBJETIVOS = [
  { t: "Mostrar os cristais do dia a dia", d: "Revelar a importância dos cristais na ciência, na tecnologia, na matemática, na história, na filosofia, na arquitetura e na arte." },
  { t: "Despertar o interesse pela ciência", d: "Usar o lado lúdico dos cristais para aproximar crianças e jovens da ciência e da tecnologia." },
  { t: "Levar a universidade até a escola", d: "Aproximar a Unifesp SJC das escolas públicas da região, com aulas e oficinas (Cristhaal Educa)." },
  { t: "Fazer ciência com as próprias mãos", d: "Trazer estudantes para os laboratórios e viver um experimento de cristalização do início ao fim (Cristhaal Experimenta)." },
  { t: "Mostrar quem faz ciência", d: "Contar a trajetória de mulheres negras brasileiras na ciência, porque representatividade importa (Cristhaal Inspira)." },
  { t: "Formar cidadãos críticos", d: "Contribuir para a formação de pessoas mais conscientes, com subsídios para a análise crítica e o empreendedorismo." },
];

export default function QuemSomos() {
  return (
    <div className="wrap">
      <div className="page-head"><h1>Quem somos</h1></div>
      <div className="about">
        <div className="prose">
          <p>O Cristhaal nasceu de uma conversa descontraída entre três professoras de áreas totalmente diferentes, mas com o mesmo brilho “cristalino” no olhar.</p>
          <p>A conversa girava em torno de uma ideia simples: os cristais estão por toda parte no nosso dia a dia e quase ninguém percebe. Eles estão no sal e no açúcar da cozinha, nos remédios, nos chips dos celulares e até em obras de arte e de arquitetura. Entender como um cristal se forma é essencial para a qualidade de produtos eletrônicos, farmacêuticos e culinários.</p>
          <p>O projeto usa esse tema para despertar o interesse de crianças e jovens pela ciência e pela tecnologia, com uma abordagem lúdica que também forma cidadãos mais conscientes, críticos e empreendedores.</p>
          <h2 className="prose-h2">Programa Decolar</h2>
          <p>Crianças e jovens com altas habilidades precisam ser desafiados para se manter motivados. Por isso, o projeto recebe estudantes do Programa Decolar no ICT/Unifesp para visitar laboratórios e participar de seminários feitos para eles, em matemática, física, química e biologia. A ideia é que eles se enxerguem como os futuros cientistas do país, e saibam que esse é um caminho possível.</p>
        </div>
        <aside>
          <h2 className="aside-h2">Coordenação</h2>
          <div className="profs">
            {COORDENACAO.map((p, i) => (
              <div key={i} className="prof">
                {p.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="av" src={p.foto} alt="" />
                ) : (
                  <span className="av" style={{ "--ac": p.c } as React.CSSProperties}>{p.ini}</span>
                )}
                <div><b>{p.nome}</b><small>{p.area}</small></div>
              </div>
            ))}
          </div>
          <div className="sigla-full">
            <h2 className="aside-h2 small">O nome por extenso</h2>
            <dl>
              {AREAS.map((a) => (
                <div key={a.k} style={{ display: "contents" }}>
                  <dt style={{ "--c": a.c } as React.CSSProperties}>{a.l}</dt>
                  <dd>{a.n}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      <section className="sec objetivos" id="objetivos" aria-labelledby="objTitle">
        <div className="sec-head">
          <div>
            <h2 id="objTitle">Objetivos</h2>
            <p>O que o projeto quer alcançar com cada encontro, visita e oficina.</p>
          </div>
        </div>
        <ol className="obj-grid">
          {OBJETIVOS.map((o) => (
            <li key={o.t}><h3>{o.t}</h3><p>{o.d}</p></li>
          ))}
        </ol>
      </section>

      <section className="contato" id="contato" aria-labelledby="contatoTitle">
        <div>
          <h2 id="contatoTitle">Fale com a gente</h2>
          <p>Escola, professor ou estudante com vontade de participar? A forma mais rápida de falar com o projeto é pelo Instagram. Mande uma mensagem direta.</p>
        </div>
        <a className="btn primary insta" href={INSTAGRAM} target="_blank" rel="noopener">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="17.4" cy="6.6" r="1.3" fill="currentColor" />
          </svg>
          @projetocristhaal
        </a>
      </section>
    </div>
  );
}
