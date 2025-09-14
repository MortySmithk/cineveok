// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from 'next/script';
import Link from 'next/link';
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "./components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CineVEO - Assista a Séries de TV e Filmes Online Grátis",
  description: "Se o site não abrir instale uma VPN Gratis e Confiavel, Baixe Acessando: https://1.1.1.1/ - Assista Filmes, Séries, Animes, Novelas, Doramas, Documentários e Muito Mais Somente no CineVEO!",
  icons: {
    icon: "https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png",
    apple: "https://i.ibb.co/5X8G9Kn1/cineveo-logo-r.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script src="https://cdn.jsdelivr.net/npm/disable-devtool@latest" strategy="beforeInteractive" />
        <Script id="disable-devtool-init" strategy="beforeInteractive">
          {`
            DisableDevtool({
              disableMenu: true,
              disableSelect: false,
              disableCopy: false,
              disableCut: true,
              disablePaste: false,
              clearLog: true,
              interval: 500,
              detectors: [0, 1, 3, 4, 5, 6, 7],
              ondevtoolopen: function(type, next) {
                window.location.href = 'https://i.ibb.co/5hH6bbp2/tentando-inspecionar-o-site.png';
              }
            });
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <div style={{ minHeight: 'calc(100vh - 280px)' }}>
            {children}
          </div>
          
          <footer className="site-footer">
            <div className="main-container">
              <div className="aviso-legal">
                <h3>Aviso Legal</h3>
                <p>O Site CineVEO é apenas Um AGREGADOR de Links assim como o Google. Apenas Agrega e Organiza Os Links Externos MP4. Não Somos Responsáveis Pelos Arquivos Aqui Encontrados.</p>
              </div>
              <div className="footer-grid">
                <div className="footer-section">
                  <h4>Também Criados Pelo CineVEO:</h4>
                  <ul>
                    <li><a href="https://streetflix.pro/" target="_blank" rel="noopener noreferrer">StreetFlix</a></li>
                    <li><a href="https://www.pipocine.site/" target="_blank" rel="noopener noreferrer">PipoCine</a></li>
                  </ul>
                </div>
                <div className="footer-section">
                  <h4>Parceiros</h4>
                  <ul>
                    <li><a href="https://telaoculta.vercel.app/" target="_blank" rel="noopener noreferrer">TelaOculta</a></li>
                  </ul>
                </div>
                <div className="footer-section">
                  <h4>Navegação</h4>
                  <ul>
                    <li><Link href="/filmes">Filmes</Link></li>
                    <li><Link href="/series">Séries</Link></li>
                    <li><Link href="/animacoes">Animações</Link></li>
                    <li><Link href="/api-docs">API</Link></li>
                  </ul>
                </div>
              </div>
              <div className="footer-bottom">
                <p>© 2025 CineVEO. Todos os Direitos Reservados.</p>
                <p>Email para contato: cineveok@gmail.com</p>
              </div>
            </div>
          </footer>

        </AuthProvider>
      </body>
    </html>
  );
}