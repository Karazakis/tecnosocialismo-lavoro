import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lavoro.tecnosocialismo.com"),
  title: "Lavoro — Tecnosocialismo",
  description: "Capacità, bisogni e opportunità si incontrano in un'unica rete del lavoro.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Lavoro — Capacità e bisogni si incontrano",
    description: "Opportunità, organizzazioni e attività generate dalla rete.",
    url: "https://lavoro.tecnosocialismo.com", siteName: "Tecnosocialismo Lavoro", locale: "it_IT", type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Lavoro — Capacità e bisogni si incontrano." }],
  },
  twitter: { card: "summary_large_image", title: "Lavoro — Tecnosocialismo", description: "Il lavoro incontra ciò che serve.", images: ["/og.png"] },
};

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#07090c" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}
