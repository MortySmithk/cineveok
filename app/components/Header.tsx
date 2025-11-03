// app/components/Header.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // <-- OTIMIZAÇÃO: Importado o 'dynamic'
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/app/components/firebase';

import SearchComponent from './SearchComponent';
import SearchOverlay from './SearchOverlay';
import SearchIcon from './icons/SearchIcon';
import ThemeSwitcher from './ThemeSwitcher';
import HamburgerIcon from './icons/HamburgerIcon'; // RE-ADICIONADO
import MicrophoneIcon from './icons/MicrophoneIcon';
import SideMenu from './SideMenu'; // RE-ADICIONADO
import VoiceSearchOverlay from './VoiceSearchOverlay';
// import NotificationBell from './NotificationBell'; // <-- OTIMIZAÇÃO: Importação removida

// Ícones para o SubNav
import HomeIcon from './icons/FlameIcon';
import MovieIcon from './icons/PlayIcon';
import TvIcon from './icons/StarIcon';
import HistoryIcon from './icons/HistoryIcon';

// OTIMIZAÇÃO: Carrega o sino de notificação dinamicamente (só para admins)
// Isso impede que usuários normais baixem o código ou abram conexões RTDB.
const DynamicNotificationBell = dynamic(() => import('./NotificationBell'), {
  ssr: false, // Não renderiza no servidor
  loading: () => <div style={{ width: '36px', height: '36px' }} /> // Placeholder
});


// Declaração global para a SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// (NOVO) LISTA DE ADMINS
const ADMIN_UIDS = [
  '7ZNDEaW95BMCm4zk1GIP9t6WwHn2', 
  'YHBxowyZv0hzld7hypnEWHvx5K82', 
  'QkqhyXbcURYt2zPhblWQLnJEY023', 
  'tMdWtke7PYBk4l4UNKnbrLQ4i32',
  'RDdh6WnG2LZQS8gvZuAEdYnUMDr2'
];

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

// --- COMPONENTE: MobileSubNav (Menu de Abas) ---
const MobileSubNav = () => {
  const pathname = usePathname();
  const getLinkClass = (href: string) => {
    return `sub-nav-link ${pathname === href ? 'active' : ''}`;
  };

  const navLinks = [
    { href: '/', label: 'Início', icon: <HomeIcon /> },
    { href: '/historico', label: 'Histórico', icon: <HistoryIcon /> },
    { href: '/filmes', label: 'Filmes', icon: <MovieIcon /> },
    { href: '/series', label: 'Séries', icon: <TvIcon /> },
    { href: '/animes',label: 'Animes', icon: <span>🍥</span> },
    { href: '/animacoes', label: 'Animações', icon: <span>🧸</span> },
    { href: '/doramas', label: 'Doramas', icon: <span>🇰🇷</span> },
    { href: '/novelas', label: 'Novelas', icon: <span>💃</span> },
  ];

  return (
    <nav className="mobile-sub-nav">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>
          {/* {link.icon} */}
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );
};
// --- FIM DO COMPONENTE ---


export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  
  // Estados
  const [isMenuOpen, setIsMenuOpen] = useState(false); // RE-ADICIONADO
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Fecha menus ao navegar
    setIsMenuOpen(false); // RE-ADICIONADO
    setIsProfileOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // Lógica de pesquisa por voz
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("O seu navegador não suporta a pesquisa por voz.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setIsListening(true);
      setIsVoiceOverlayOpen(true);
    };
    recognition.onend = () => {
      setIsListening(false);
      setIsVoiceOverlayOpen(false);
    };
    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsListening(false);
      setIsVoiceOverlayOpen(false);
    };
    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      router.push(`/search?q=${encodeURIComponent(speechResult)}`);
    };
    recognition.start();
  };

  return (
    <>
      {/* Overlays */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} /> {/* RE-ADICIONADO */}
      <VoiceSearchOverlay isOpen={isVoiceOverlayOpen} onClose={() => setIsVoiceOverlayOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <header className="site-header-main">
        <div className="header-content">
          
          {/* COLUNA ESQUERDA: Menu (Desktop) e Logo */}
          <div className="header-left">
            {/* Botão Hambúrguer RE-ADICIONADO (só desktop) */}
            <button onClick={() => setIsMenuOpen(true)} className="hamburger-btn-desktop focusable" aria-label="Abrir menu">
              <HamburgerIcon />
            </button>
            <Link href="/" className="focusable logo-link">
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

          {/* COLUNA CENTRAL: Pesquisa */}
          <div className="header-center">
            <div className="header-search-desktop">
              <SearchComponent />
            </div>
            <button className="voice-search-btn-global focusable" onClick={handleVoiceSearch} aria-label="Pesquisa por voz">
              <MicrophoneIcon width={20} height={20} />
            </button>
          </div>

          {/* COLUNA DIREITA: Ícones */}
          <div className="header-right">

            {/* (NOVO) SINO DE NOTIFICAÇÃO (SÓ APARECE PARA ADMINS) */}
            {/* OTIMIZAÇÃO: Renderiza o componente dinâmico */}
            {user && ADMIN_UIDS.includes(user.uid) && (
              <DynamicNotificationBell />
            )}

            <ThemeSwitcher />
            
            <button className="header-search-mobile-btn focusable" onClick={() => setIsSearchOpen(true)}>
              <SearchIcon width={24} height={24} />
            </button>

            {/* Perfil (Desktop) */}
            <div className="header-auth-desktop">
              {user ? (
                  <>
                    <button 
                      className="header-profile-desktop-btn focusable" 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                    >
                      {user.photoURL ? (
                        <Image src={user.photoURL} alt="User" width={32} height={32} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <UserIcon width={24} height={24} />
                      )}
                      <span>Olá, {user.displayName?.split(' ')[0] || 'Utilizador'}</span>
                    </button>
                    {isProfileOpen && (
                      <div className="header-profile-dropdown">
                        <div className="dropdown-user-info">
                          <strong>{user.displayName || 'Utilizador'}</strong>
                          <span>{user.email}</span>
                        </div>
                        <Link href="/perfil" className="dropdown-link-item focusable">Minha Conta</Link>
                        <Link href="/historico" className="dropdown-link-item focusable">Meu Histórico</Link>
                        <button onClick={handleSignOut} className="dropdown-signout-btn focusable">Sair da conta</button>
                      </div>
                    )}
                  </>
              ) : (
                  <Link href="/login" className="btn-primary-small focusable">Entrar</Link>
              )}
            </div>
            
            {/* Perfil (Mobile) */}
            <div className="header-profile-mobile">
              <button 
                className="header-profile-mobile-btn focusable" 
                onClick={() => user ? setIsProfileOpen(!isProfileOpen) : router.push('/login')}
              >
                {user && user.photoURL ? (
                  <Image src={user.photoURL} alt="User" width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon width={22} height={22} />
                )}
              </button>

              {user && isProfileOpen && (
                <div className="header-profile-dropdown">
                  <div className="dropdown-user-info">
                    <strong>{user.displayName || 'Utilizador'}</strong>
                    <span>{user.email}</span>
                  </div>
                  <Link href="/perfil" className="dropdown-link-item focusable">Minha Conta</Link>
                  <Link href="/historico" className="dropdown-link-item focusable">Meu Histórico</Link>
                  <button onClick={handleSignOut} className="dropdown-signout-btn focusable">Sair da conta</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* --- RENDERIZA O MENU DE ABAS MOBILE --- */}
      <MobileSubNav />
    </>
  );
}