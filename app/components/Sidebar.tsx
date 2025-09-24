"use client";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

// Importações corrigidas para usar 'export default'
import HomeIcon from './icons/HomeIcon';
import SeriesIcon from './icons/SeriesIcon';
import MoviesIcon from './icons/MoviesIcon';
import SettingsIcon from './icons/SettingsIcon';
import SearchIconTV from './icons/SearchIconTV';
import AnimeIcon from './icons/AnimeIcon';
import DramaIcon from './icons/DramaIcon';
import UserIcon from './icons/UserIcon';

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const navItems = [
    { href: '/tv/search', icon: SearchIconTV, label: 'Pesquisar' },
    { href: '/tv', icon: HomeIcon, label: 'Início' },
    { href: '/tv/series', icon: SeriesIcon, label: 'Séries' },
    { href: '/tv/filmes', icon: MoviesIcon, label: 'Filmes' },
    { href: '/tv/animes', icon: AnimeIcon, label: 'Animes' },
    { href: '/tv/doramas', icon: DramaIcon, label: 'Doramas' },
    // A aba "Jogos" foi removida conforme solicitado
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/tv');
  };

  return (
    <aside className="tv-sidebar">
      <div className="tv-sidebar-content">
        {user ? (
          <div className="tv-sidebar-user-info">
            <span className="tv-sidebar-user-greeting">Olá, {user.displayName?.split(' ')[0] || 'Utilizador'}</span>
            <button onClick={handleSignOut} className="tv-sidebar-logout focusable">
              Sair
            </button>
          </div>
        ) : (
          <Link href="/tv/login" className="tv-sidebar-login focusable">
            <UserIcon />
            <span>Fazer login</span>
          </Link>
        )}
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`tv-sidebar-item focusable ${pathname === item.href ? 'active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        {/* Item de Configurações movido para o final, fora da navegação principal */}
        <div className="tv-sidebar-footer">
          <Link href="#" className="tv-sidebar-item focusable">
              <SettingsIcon />
              <span>Configurações</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};