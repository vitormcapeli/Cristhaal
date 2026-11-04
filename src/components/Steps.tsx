import { STEPS } from "@/lib/data";

export function Steps({ color }: { color?: string }) {
  return (
    <ol className="steps" style={color ? ({ "--fc": color } as React.CSSProperties) : undefined}>
      {STEPS.map(([t, d]) => (
        <li key={t}><div><b>{t}</b><span>{d}</span></div></li>
      ))}
    </ol>
  );
}
