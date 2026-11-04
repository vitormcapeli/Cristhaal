import type { Metadata } from "next";
import { AREAS, COORDENACAO } from "@/lib/data";

export const metadata: Metadata = { title: "Sobre" };

export default function Sobre() {
  return (
    <div className="wrap">
      <div className="page-head"><h1>Sobre o projeto</h1></div>
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
    </div>
  );
}
