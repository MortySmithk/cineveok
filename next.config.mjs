// cineveo-next/next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ATUALIZADO: 'false' REATIVA a otimização de imagens.
    // Isso otimiza as "capas" e corrige o "peso" do site.
    unoptimized: false, 

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/**',
      },
      // ADICIONADO: Corrige o erro da imagem do Telegram
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Esta parte ignora os erros de ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ADICIONE ESTE BLOCO PARA A VERSÃO LEVE
  async rewrites() {
    return [
      {
        source: '/cineleve', // A URL que o usuário acessará
        destination: '/CineLeve.html', // O arquivo que será servido (dentro da pasta /public)
      },
    ]
  },
};

export default nextConfig;