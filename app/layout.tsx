"use client"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from 'next/script';
import Link from 'next/link';
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "./components/AuthProvider";
import { useAppNavigation } from "./hooks/useAppNavigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAppNavigation(); // Aplica a navegação por controle remoto em todo o site
  
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
                    <li><a href="https://streetflix.pro/" target="_blank" rel="noopener noreferrer" className="focusable">StreetFlix</a></li>
                    <li><a href="https://www.pipocine.site/" target="_blank" rel="noopener noreferrer" className="focusable">PipoCine</a></li>
                  </ul>
                </div>
                <div className="footer-section">
                  <h4>Parceiros</h4>
                  <ul>
                    <li><a href="https://telaoculta.vercel.app/" target="_blank" rel="noopener noreferrer" className="focusable">TelaOculta</a></li>
                  </ul>
                </div>
                <div className="footer-section">
                  <h4>Navegação</h4>
                  <ul>
                    <li><Link href="/filmes" className="focusable">Filmes</Link></li>
                    <li><Link href="/series" className="focusable">Séries</Link></li>
                    <li><Link href="/animacoes" className="focusable">Animações</Link></li>
                    <li><Link href="/api/api-docs" className="focusable">API</Link></li>
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