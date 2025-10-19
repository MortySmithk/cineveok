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
};

export default nextConfig;