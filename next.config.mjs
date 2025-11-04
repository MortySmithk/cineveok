// cineveo-next/next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Adicione esta linha para desativar a otimização de imagens da Vercel
    unoptimized: true,

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