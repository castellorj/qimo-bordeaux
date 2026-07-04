/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Site 100% estático (todas as páginas são SSG) — ideal para Netlify.
  output: "export",
  images: {
    // Usamos <img> comum (fotos reais), então a otimização do next/image é dispensada.
    unoptimized: true,
  },
  trailingSlash: false,
};

export default nextConfig;
