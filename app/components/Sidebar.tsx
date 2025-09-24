"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon } from './icons/HomeIcon';
import { GameIcon } from './icons/GameIcon';
import { MoviesIcon } from './icons/MoviesIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { SearchIconTV } from './icons/SearchIconTV';

const navItems = [
  { href: '/tv/search', icon: SearchIconTV, label: 'Pesquisar' },
  { href: '/tv', icon: HomeIcon, label: 'Início' },
  { href: '#', icon: GameIcon, label: 'Jogos' },
  { href: '#', icon: MoviesIcon, label: 'Filmes' },
  { href: '#', icon: SettingsIcon, label: 'Configurações' },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="tv-sidebar">
      <div className="tv-sidebar-content">
        <a href="#" className="tv-sidebar-login focusable">
          <span>Fazer login</span>
        </a>
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
      </div>
    </aside>
  );
};