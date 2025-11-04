// app/layout.tsx
import type { Metadata } from "next";
// 1. Importar a fonte 'Inter' do next/font
import { Inter } from "next/font/google";
import Script from 'next/script';
import Link from 'next/link';
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";
import FloatingTelegramButton from "./components/FloatingTelegramButton";
// 2. Importar 'dynamic' para carregamento dinâmico
import dynamic from "next/dynamic";

// 3. Configurar a fonte 'Inter'
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Garante que o texto apareça rápido
  variable: '--font-inter' // Cria uma variável CSS
});

// 4. Carregar o Chatango dinamicamente (só no cliente)
const DynamicChatango = dynamic(
  () => import('./components/ChatangoEmbed'),
  { ssr: false } 
);

export const metadata: Metadata = {
  title: "Assistir Filmes e Séries Online HD, Filmes Online, Séries Online.",
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
    // 5. Aplicar a variável da fonte ao <html>
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, orientation=portrait" />
      </head>
      {/* 6. Remover 'inter.className' do body (já está no html) */}
      <body className="">
        <ThemeProvider>
          <AuthProvider>
              <Header />
              <div style={{ minHeight: 'calc(100vh - 280px)' }}>
                {children}
              </div>

              <footer className="site-footer">
                <div className="main-container">
                  {/* 7. Renderizar o chat dinâmico */}
                  <DynamicChatango />

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
          <FloatingTelegramButton />
        </ThemeProvider>
      </body>
    </html>
  );
}