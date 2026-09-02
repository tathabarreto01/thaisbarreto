import type { Metadata, Viewport } from "next";
import { Sora, Manrope, Caveat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell";

// Só 700/800 são usados (font-display sempre vem com font-bold ou font-extrabold).
const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Decorativa (font-hand), sempre em peso normal e nunca no conteúdo principal.
// `preload: false` tira 74 KB do caminho crítico: o texto aparece na fonte de
// fallback e troca depois, sem atrasar o LCP.
const hand = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Mapa de Prospectos — CRM",
  description:
    "Registre e organize seus prospectos por família, amigos, redes sociais, comunidade e trabalho. Sua próxima oportunidade pode estar mais perto do que você pensa.",
  applicationName: "Mapa de Prospectos",
  // Instalado na tela inicial do iOS: abre em tela cheia com o nome curto.
  appleWebApp: {
    capable: true,
    title: "Prospectos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applied before paint to avoid a theme flash / hydration mismatch.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.dataset.theme='dark';}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${hand.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
