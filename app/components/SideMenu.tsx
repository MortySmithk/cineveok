// app/components/SideMenu.tsx
"use client";

import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';
import FlameIcon from './icons/FlameIcon';
import HistoryIcon from './icons/HistoryIcon';
import BookmarkIcon from './icons/BookmarkIcon'; // <-- 1. IMPORTAR

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const handleLinkClick = () => {
    onClose();
  };

  // ... (função getLinkClass permanece a mesma)
  const getLinkClass = (path: string) => {
    return `menu-link ${pathname === path ? 'active' : ''}`;
  };

  return (
    <>
      <div 
        className={`side-menu-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <div className="menu-header">
          {user ? (
            <Link href="/perfil" className="menu-profile-link" onClick={handleLinkClick}>
              <img
                src={user.photoURL || 'https://i.ibb.co/XzZ0b1B/placeholder.png'}
                alt="Perfil"
                className="menu-profile-img"
              />
              <span className="menu-profile-name">{user.displayName || 'Ver Perfil'}</span>
            </Link>
          ) : (
            <Link href="/login" className="menu-profile-link" onClick={handleLinkClick}>
              <div className="menu-profile-img-placeholder"></div>
              <span className="menu-profile-name">Fazer Login</span>
            </Link>
          )}
        </div>

        <nav className="menu-nav">
          <ul>
            <li>
              <Link href="/" className={getLinkClass('/')} onClick={handleLinkClick}>
                <FlameIcon />
                <span>Início</span>
              </Link>
            </li>
            {/* 2. ADICIONAR O NOVO LINK */}
            {user && (
              <li>
                <Link href="/assistir-mais-tarde" className={getLinkClass('/assistir-mais-tarde')} onClick={handleLinkClick}>
                  <BookmarkIcon />
                  <span>Assistir mais tarde</span>
                </Link>
              </li>
            )}
            <li>
              <Link href="/historico" className={getLinkClass('/historico')} onClick={handleLinkClick}>
                <HistoryIcon />
                <span>Histórico</span>
              </Link>
            </li>
          </ul>

          <div className="menu-divider" />

          <ul>
            <li>
              <Link href="/filmes" className={getLinkClass('/filmes')} onClick={handleLinkClick}>
                <span>Filmes</span>
              </Link>
            </li>
            <li>
              <Link href="/series" className={getLinkClass('/series')} onClick={handleLinkClick}>
                <span>Séries</span>
              </Link>
            </li>
            <li>
              <Link href="/animes" className={getLinkClass('/animes')} onClick={handleLinkClick}>
                <span>Animes</span>
              </Link>
            </li>
            <li>
              <Link href="/animacoes" className={getLinkClass('/animacoes')} onClick={handleLinkClick}>
                <span>Animações</span>
              </Link>
            </li>
            <li>
              <Link href="/novelas" className={getLinkClass('/novelas')} onClick={handleLinkClick}>
                <span>Novelas</span>
              </Link>
            </li>
            <li>
              <Link href="/doramas" className={getLinkClass('/doramas')} onClick={handleLinkClick}>
                <span>Doramas</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="menu-footer">
          {user && (
            <button onClick={signOut} className="menu-logout-btn focusable">
              Sair da conta
            </button>
          )}
        </div>
      </div>
    </>
  );
}