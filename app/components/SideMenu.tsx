// app/components/SideMenu.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import HamburgerIcon from './icons/HamburgerIcon';
import HomeIcon from './icons/FlameIcon'; // Usando FlameIcon para "Início/Em Alta"
import MovieIcon from './icons/PlayIcon'; // Usando PlayIcon para "Filmes"
import TvIcon from './icons/StarIcon'; // Usando StarIcon para "Séries"
import HistoryIcon from './icons/HistoryIcon'; // <-- RE-ADICIONADO

// Importação do CSS específico do SideMenu
import "./SideMenu.css";

// Interface para os links
interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  isExternal?: boolean;
}

// Componente de ícone genérico para links
const LinkIcon = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '24px', height: '24px' }}>{children}</div>
);

export default function SideMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Todos os seus links de navegação
  const navLinks: NavLink[] = [
    { href: '/', label: 'Início', icon: <HomeIcon /> },
    { href: '/historico', label: 'Histórico', icon: <HistoryIcon /> }, // <-- RE-ADICIONADO
    { href: '/filmes', label: 'Filmes', icon: <MovieIcon /> },
    { href: '/series', label: 'Séries', icon: <TvIcon /> },
    { href: '/animes', label: 'Animes', icon: <LinkIcon>🍥</LinkIcon> },
    { href: '/animacoes', label: 'Animações', icon: <LinkIcon>🧸</LinkIcon> },
    { href: '/doramas', label: 'Doramas', icon: <LinkIcon>🇰🇷</LinkIcon> },
    { href: '/novelas', label: 'Novelas', icon: <LinkIcon>💃</LinkIcon> },
    {
      href: '/cineleve',
      label: 'CineLeve',
      icon: <LinkIcon>⚡</LinkIcon>,
      isExternal: true
    },
  ];

  const getLinkClass = (href: string): string => {
    const isActive = pathname === href;
    return `side-menu-link ${isActive ? 'active' : ''}`; // 'focusable' REMOVIDO
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Overlay para fechar o menu */}
      <div className="side-menu-overlay" onClick={onClose} />
      
      {/* Conteúdo do Menu */}
      <div className="side-menu-content">
        <div className="side-menu-header">
          <button onClick={onClose} className="hamburger-btn" aria-label="Fechar menu"> {/* 'focusable' REMOVIDO */}
            <HamburgerIcon />
          </button>
          <Link href="/" className="" onClick={onClose}> {/* 'focusable' REMOVIDO */}
            <Image
              src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png"
              alt="CineVEO Logo"
              width={140}
              height={35}
              priority
              style={{ objectFit: 'contain' }}
            />
          </Link>
        </div>
        
        <nav className="side-menu-nav">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={getLinkClass(link.href)}
              onClick={onClose}
              prefetch={link.isExternal ? false : undefined}
            >
              {link.icon}
              <span>{link.label}</span>
              {link.href === '/cineleve' && <span className="cineleve-badge">Leve</span>}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}