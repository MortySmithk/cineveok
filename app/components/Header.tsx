// cineveo-next/app/components/Header.tsx
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

// Ícone de usuário para o botão de perfil
const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsSearchOpen(false);
    setIsProfileOpen(false);
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
  
  const getMobileLinkClass = (href: string): string => {
      const isActive = pathname === href;
      return `mobile-nav-link focusable ${isActive ? 'active' : ''}`;
  }

  return (
    <>
      <header className="site-header-main">
        <div className="header-content">
          <div className="header-left">
              <Link href="/" className="focusable">
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
              <Link href="/" style={getLinkStyle('/')} className="focusable">Início</Link>
              <Link href="/filmes" style={getLinkStyle('/filmes')} className="focusable">Filmes</Link>
              <Link href="/series" style={getLinkStyle('/series')} className="focusable">Séries</Link>
              <Link href="/animes" style={getLinkStyle('/animes')} className="focusable">Animes</Link>
              <Link href="/doramas" style={getLinkStyle('/doramas')} className="focusable">Doramas</Link>
            </nav>
          </div>

          <div className="header-right">
            <div className="header-search-desktop">
              <SearchComponent />
            </div>
            
            <div className="header-auth-desktop">
              {user ? (
                  <>
                      <span className="user-greeting">Olá, {user.displayName?.split(' ')[0] || 'Utilizador'}</span>
                      <button onClick={handleSignOut} className="btn-secondary-small focusable">Sair</button>
                  </>
              ) : (
                  <Link href="/login" className="btn-primary-small focusable">Entrar</Link>
              )}
            </div>
            
            {/* --- Botões Mobile --- */}
            <div className="header-mobile-actions">
                <button className="header-search-mobile-btn focusable" onClick={() => setIsSearchOpen(true)}>
                  <SearchIcon width={24} height={24} />
                </button>
                
                {/* BOTÃO DE PERFIL/LOGIN MOBILE */}
                <div className="header-profile-mobile">
                  <button 
                    className="header-profile-mobile-btn focusable" 
                    onClick={() => user ? setIsProfileOpen(!isProfileOpen) : router.push('/login')}
                  >
                    {user && user.photoURL ? (
                      <Image src={user.photoURL} alt="User" width={28} height={28} style={{ borderRadius: '50%' }} />
                    ) : (
                      <UserIcon width={22} height={22} />
                    )}
                  </button>

                  {/* CORREÇÃO AQUI: O dropdown agora só renderiza se o usuário estiver logado e o perfil aberto */}
                  {user && isProfileOpen && (
                    <div className="header-profile-dropdown">
                      <div className="dropdown-user-info">
                        <strong>{user.displayName?.split(' ')[0] || 'Utilizador'}</strong>
                        <span>{user.email}</span>
                      </div>
                      <button onClick={handleSignOut} className="dropdown-signout-btn focusable">Sair da conta</button>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
        
        {/* --- NAVEGAÇÃO APENAS PARA CELULAR --- */}
        <nav className="mobile-sub-nav">
            <Link href="/" className={getMobileLinkClass('/')}>Início</Link>
            <Link href="/filmes" className={getMobileLinkClass('/filmes')}>Filmes</Link>
            <Link href="/series" className={getMobileLinkClass('/series')}>Séries</Link>
            <Link href="/animes" className={getMobileLinkClass('/animes')}>Animes</Link>
            <Link href="/doramas" className={getMobileLinkClass('/doramas')}>Doramas</Link>
        </nav>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}