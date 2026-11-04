"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { f1 } from "@/lib/geometry";
import { Logo } from "./Logo";

const FORM_MS = 4100;

/** O logo se forma: bolinhas voam até o lugar, a borda se desenha, os cristais crescem e o nome é escrito. */
export function HeroLogo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [formed, setFormed] = useState(false);

  const svg = () => btnRef.current?.querySelector("svg") ?? null;
  const shards = () => [...(btnRef.current?.querySelectorAll<SVGGElement>(".lg-shard") ?? [])];
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const resetTilt = useCallback(() => {
    const s = svg();
    if (s) s.style.transform = "";
    shards().forEach((g) => (g.style.transform = ""));
  }, []);

  const form = useCallback(() => {
    const s = svg();
    if (!s) return;
    s.classList.remove("pre"); // .pre esconde o logo até a animação começar, para não piscar já pronto
    if (reduced()) { setFormed(true); return; }
    window.clearTimeout(timer.current);
    setFormed(false);
    resetTilt();
    s.classList.remove("forming");
    void s.getBoundingClientRect(); // reinicia as animações CSS
    s.classList.add("forming");
    timer.current = window.setTimeout(() => { s.classList.remove("forming"); setFormed(true); }, FORM_MS);
  }, [resetTilt]);

  useEffect(() => {
    // Espera a fonte manuscrita (com limite) para o nome não "pular" no meio da escrita.
    const go = () => requestAnimationFrame(form);
    Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]).then(go, go);
    return () => window.clearTimeout(timer.current);
  }, [form]);

  const onMove = (e: React.PointerEvent) => {
    if (!formed || reduced() || e.pointerType === "touch") return;
    const b = stageRef.current!.getBoundingClientRect();
    const dx = (e.clientX - b.left) / b.width - 0.5, dy = (e.clientY - b.top) / b.height - 0.5;
    const s = svg();
    if (s) s.style.transform = `perspective(1000px) rotateY(${f1(dx * 12)}deg) rotateX(${f1(-dy * 12)}deg)`;
    const ang = (Math.atan2(dx, -dy) * 180) / Math.PI, dist = Math.min(1, Math.hypot(dx, dy) * 2.4);
    shards().forEach((g) => {
      const diff = Math.abs((((ang - Number(g.dataset.a)) % 360) + 540) % 360 - 180);
      const k = Math.max(0, 1 - diff / 45) * dist;
      g.style.transform = k > 0.01 ? `scale(${(1 + k * 0.1).toFixed(3)})` : "";
    });
  };

  return (
    <div ref={stageRef} className={`hero-stage${formed ? " formed" : ""}`} onPointerMove={onMove} onPointerLeave={resetTilt}>
      <svg className="lattice" aria-hidden="true">
        <defs>
          <pattern id="hexlat" width="34" height="29.4" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1.8" fill="currentColor" /><circle cx="34" cy="0" r="1.8" fill="currentColor" />
            <circle cx="17" cy="14.7" r="1.8" fill="currentColor" /><circle cx="0" cy="29.4" r="1.8" fill="currentColor" />
            <circle cx="34" cy="29.4" r="1.8" fill="currentColor" />
            <path d="M0 0L17 14.7L34 0M0 29.4L17 14.7L34 29.4" stroke="currentColor" strokeWidth=".5" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexlat)" />
      </svg>
      <button ref={btnRef} className="logo-btn" type="button" onClick={form} aria-label="Ver o logo do Projeto Cristhaal se formar de novo">
        <Logo className="logo pre" />
      </button>
      <span className="replay" aria-hidden="true">Toque no logo para vê-lo crescer de novo</span>
    </div>
  );
}
