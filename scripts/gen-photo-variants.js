// Gera variantes WebP responsivas das fotos locais (não-destrutivo: mantém os originais).
// Saída: public/photos/<nome>-<largura>.webp + manifesto src/lib/photoVariants.ts
// Rodar: node scripts/gen-photo-variants.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = "public/photos";
const TARGETS = [480, 960, 1600];
const QUALITY = 70;

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|png)$/i.test(f) && !/-\d+\.webp$/.test(f));
  const manifest = {};
  let made = 0;
  for (const file of files) {
    const name = file.replace(/\.(jpe?g|png)$/i, "");
    const src = path.join(DIR, file);
    const meta = await sharp(src).metadata();
    const orig = meta.width || 1600;
    // larguras <= original, incluindo um "topo" limitado a 1600
    const widths = [...new Set(TARGETS.filter((w) => w < orig).concat(Math.min(1600, orig)))].sort((a, b) => a - b);
    for (const w of widths) {
      const out = path.join(DIR, `${name}-${w}.webp`);
      await sharp(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
      made++;
    }
    manifest[name] = widths;
  }
  const ts =
    "// Gerado por scripts/gen-photo-variants.js — larguras WebP disponíveis por foto.\n" +
    "// Usado por PhotoImg para montar o srcset. Não editar à mão.\n" +
    "export const PHOTO_VARIANTS: Record<string, number[]> = " +
    JSON.stringify(manifest, null, 0) +
    ";\n";
  fs.writeFileSync("src/lib/photoVariants.ts", ts);
  console.log(`Fotos: ${files.length} · variantes geradas: ${made}`);
})();
