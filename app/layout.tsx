import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import { AuthProvider } from './components/AuthProvider';
import { AppInitializer } from './components/AppInitializer';
import FloatingTelegramButton from './components/FloatingTelegramButton';
import { ThemeProvider } from './components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://cineveo.com'),
  title: 'CineVeo - Assista a Filmes, Séries, Animes e Doramas Online',
  description: 'Assista a uma vasta gama de filmes, séries, animes e doramas online em alta qualidade no CineVeo. Streaming gratuito, sem necessidade de cadastro e livre de anúncios.',
  openGraph: {
    title: 'CineVeo - Streaming de Filmes e Séries Online',
    description: 'Descubra e assista a milhares de filmes, séries, animes e doramas gratuitamente no CineVeo.',
    images: ['https://cineveo.com/og-image.jpg'],
    url: 'https://cineveo.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CineVeo - Assista a Filmes, Séries, Animes e Doramas Online',
    description: 'Sua plataforma definitiva para streaming de entretenimento asiático e mundial. Sem anúncios, sem custo.',
    images: ['https://cineveo.com/twitter-image.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, orientation=portrait" />
        <meta name="google-site-verification" content="seu-codigo-de-verificacao-aqui" />
        <meta name="msvalidate.01" content="seu-codigo-de-verificacao-aqui" />
        <link rel="canonical" href="https://cineveo.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppInitializer>
              <Header />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
              <FloatingTelegramButton />
            </AppInitializer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}