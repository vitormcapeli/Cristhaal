/** Reduz a foto para caber no rascunho: no máximo 1600 px de largura, em JPEG. */
export async function imageToDataUrl(file: Blob, max = 1600): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / bmp.width);
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c.toDataURL("image/jpeg", 0.82);
}

/** As imagens de uma lista de arquivos, já reduzidas. Arquivos que não abrem são ignorados. */
export async function arquivosParaImagens(files: Iterable<File>): Promise<string[]> {
  const imgs = [...files].filter((f) => f.type.startsWith("image/"));
  const urls = await Promise.all(imgs.map((f) => imageToDataUrl(f).catch(() => "")));
  return urls.filter(Boolean);
}
