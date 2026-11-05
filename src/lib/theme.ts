export const THEME_KEY = "cristhaal-tema";

// Roda antes da página aparecer (ver layout.tsx), para não piscar no tema errado.
// Sem escolha salva, o site segue o tema do sistema (prefers-color-scheme no CSS).
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
