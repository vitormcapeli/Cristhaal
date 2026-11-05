import { STEPS } from "@/lib/data";
import type { BoxProps } from "@/lib/rich";

export function Steps({ color, box }: { color?: string; box?: BoxProps }) {
  return (
    <ol className="steps" {...box} style={{ ...(color ? ({ "--fc": color } as React.CSSProperties) : null), ...box?.style }}>
      {STEPS.map(([t, d]) => (
        <li key={t}><div><b>{t}</b><span>{d}</span></div></li>
      ))}
    </ol>
  );
}
