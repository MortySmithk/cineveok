// app/components/Header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { CSSProperties, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

import SearchComponent from './SearchComponent';
import SearchOverlay from './SearchOverlay';
import SearchIcon from './icons/SearchIcon';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fecha os menus quando a rota muda
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getLinkStyle = (href: string): CSSProperties => {
    const isActive = pathname === href;
    return {
      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      fontWeight: isActive ? 700 : 500,
      transition: 'color 0.2s ease',
    };
  };

  return (
    <>
      <header className="site-header-main">
        <div className="header-content">
          <div className="header-left">
            {!isMenuOpen && (
              <Link href="/">
                <Image
                  src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png"
                  alt="CineVEO Logo"
                  width={160}
                  height={40}
                  priority
                  style={{ objectFit: 'contain' }}
                />
              </Link>
            )}
            <nav className="header-nav-desktop">
              <Link href="/" style={getLinkStyle('/')}>Início</Link>
              <Link href="/filmes" style={getLinkStyle('/filmes')}>Filmes</Link>
              <Link href="/series" style={getLinkStyle('/series')}>Séries</Link>
              <Link href="/animacoes" style={getLinkStyle('/animacoes')}>Animações</Link>
              <Link href="/novelas" style={getLinkStyle('/novelas')}>Novelas</Link>
              <Link href="/animes" style={getLinkStyle('/animes')}>Animes</Link>
            </nav>
          </div>

          <div className="header-right">
            <div className="header-search-desktop">
              <SearchComponent />
            </div>
            <button className="header-search-mobile-btn" onClick={() => setIsSearchOpen(true)}>
              <SearchIcon width={22} height={22} />
            </button>
            
            <div className="header-auth-desktop">
              {user ? (
                  <>
                      <span className="user-greeting">Olá, {user.displayName?.split(' ')[0] || 'Utilizador'}</span>
                      <button onClick={handleSignOut} className="btn-secondary-small">Sair</button>
                  </>
              ) : (
                  <Link href="/login" className="btn-primary-small">Entrar</Link>
              )}
            </div>
            
            <button className="hamburger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? 
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : 
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              }
            </button>
          </div>
        </div>
      </header>

      {/* Overlays */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
        <nav className="mobile-nav-links">
            <Link href="/" style={getLinkStyle('/')}>Início</Link>
            <Link href="/filmes" style={getLinkStyle('/filmes')}>Filmes</Link>
            <Link href="/series" style={getLinkStyle('/series')}>Séries</Link>
            <Link href="/animacoes" style={getLinkStyle('/animacoes')}>Animações</Link>
            <Link href="/novelas" style={getLinkStyle('/novelas')}>Novelas</Link>
            <Link href="/animes" style={getLinkStyle('/animes')}>Animes</Link>
            <Link href="/api-docs" style={getLinkStyle('/api-docs')}>API</Link> {/* LINHA ADICIONADA */}
        </nav>
        <div className="mobile-auth">
            {user ? (
                <>
                    <span>Olá, {user.displayName?.split(' ')[0] || 'Utilizador'}</span>
                    <button onClick={handleSignOut} className="btn-secondary-small">Sair</button>
                </>
            ) : (
                <Link href="/login" className="btn-primary-small">Entrar</Link>
            )}
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}