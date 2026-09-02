import type { MetadataRoute } from "next";

/**
 * Web App Manifest — usado quando o app é instalado na tela inicial.
 * Os ícones "maskable" têm a marca dentro da zona de segurança e o fundo
 * sangrando até a borda, então o Android aplica a máscara (círculo, squircle…)
 * sem cortar nem distorcer o desenho.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mapa de Prospectos",
    short_name: "Prospectos",
    description:
      "Registre e organize seus prospectos por família, amigos, redes sociais, comunidade e trabalho.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "pt-BR",
    background_color: "#e8f0ff",
    theme_color: "#2563eb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
