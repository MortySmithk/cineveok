// app/components/Header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { CSSProperties, useState } from 'react';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import SearchComponent from './SearchComponent'; // Importa o novo componente

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header-main">
      <div className="header-content">
        <div className="header-left">
          <Link href="/">
            <Image
              src="https://i.ibb.co/s91tyczd/Gemini-Generated-Image-ejjiocejjiocejji-1.png"
              alt="CineVEO Logo"
              width={140}
              height={35}
              priority
              style={{ objectFit: 'contain' }}
            />
          </Link>
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
          <SearchComponent />
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
            &#9776; {/* Ícone de hambúrguer */}
          </button>
        </div>
      </div>
      
      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="mobile-menu">
            <nav className="mobile-nav-links">
                <Link href="/" style={getLinkStyle('/')} onClick={closeMenu}>Início</Link>
                <Link href="/filmes" style={getLinkStyle('/filmes')} onClick={closeMenu}>Filmes</Link>
                <Link href="/series" style={getLinkStyle('/series')} onClick={closeMenu}>Séries</Link>
                <Link href="/animacoes" style={getLinkStyle('/animacoes')} onClick={closeMenu}>Animações</Link>
                <Link href="/novelas" style={getLinkStyle('/novelas')} onClick={closeMenu}>Novelas</Link>
                <Link href="/animes" style={getLinkStyle('/animes')} onClick={closeMenu}>Animes</Link>
            </nav>
            <div className="mobile-auth">
                {user ? (
                    <>
                        <span>Olá, {user.displayName?.split(' ')[0] || 'Utilizador'}</span>
                        <button onClick={() => { handleSignOut(); closeMenu(); }} className="btn-secondary-small">Sair</button>
                    </>
                ) : (
                    <Link href="/login" className="btn-primary-small" onClick={closeMenu}>Entrar</Link>
                )}
            </div>
        </div>
      )}
    </header>
  );
}