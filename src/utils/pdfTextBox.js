import { rgb } from 'pdf-lib';
export function createPdfTextWriter(pdf, canvasFactory, background = [1, 1, 1]) {
  return async function box(page, x, top, width, height, lines, fontSize = 11, clear = true) {
    const crop = page.getCropBox();
    if (clear) page.drawRectangle({ x, y: crop.y + crop.height - top - height, width, height, color: rgb(...background) });
    const canvas = canvasFactory();
    const scale = 3;
    canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = '#111827';
    let rendered;
    for (let size = fontSize; size >= 7; size -= 0.5) {
      ctx.font = `${size}px Tahoma, Arial, sans-serif`;
      rendered = [];
      for (const text of lines) {
        let line = '';
        for (const word of String(text).split(/\s+/)) {
          const next = line ? `${line} ${word}` : word;
          if (ctx.measureText(next).width > width - 8 && line) { rendered.push(line); line = word; }
          else line = next;
        }
        rendered.push(line);
      }
      if (rendered.length * size * 1.5 <= height - 4 && rendered.every(line => ctx.measureText(line).width <= width - 8)) {
        rendered.forEach((line, index) => ctx.fillText(line, width - 4, 2 + index * size * 1.5));
        const image = await pdf.embedPng(canvas.toDataURL('image/png'));
        page.drawImage(image, { x, y: crop.y + crop.height - top - height, width, height });
        return;
      }
    }
    throw new Error('Contract text is too long for the template. Shorten the field and try again.');
  }
}
