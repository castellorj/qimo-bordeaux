import type { ImgHTMLAttributes } from "react";
import { PHOTO_VARIANTS } from "@/lib/photoVariants";

/**
 * <img> com WebP responsivo para as fotos locais (/photos/*).
 * Serve a variante do tamanho da tela (grande economia no celular/WhatsApp) e cai
 * no arquivo original como fallback. Para URLs externas / do painel, vira um <img> normal.
 */
export function webpSrcSet(src?: string): string | null {
  if (!src) return null;
  const m = src.match(/^\/photos\/([^/?#]+)\.(?:jpe?g|png)$/i);
  if (!m) return null;
  const widths = PHOTO_VARIANTS[m[1]];
  if (!widths?.length) return null;
  return widths.map((w) => `/photos/${m[1]}-${w}.webp ${w}w`).join(", ");
}

type Props = {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;

export function PhotoImg({ src, alt, sizes = "100vw", priority, loading, className, ...rest }: Props) {
  const srcSet = webpSrcSet(src);
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as any } : null)}
      {...rest}
    />
  );
  if (!srcSet) return img;
  // display:contents → o <picture> é transparente ao layout; a <img> se posiciona
  // pelo pai real (funciona tanto para heróis absolutos quanto para imgs com aspect-ratio).
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      {img}
    </picture>
  );
}
