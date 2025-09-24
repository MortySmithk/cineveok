import { Sidebar } from './components/Sidebar';
import './tv.css';

export default function TVLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div id="tv-app-container">
          <Sidebar />
          <main id="tv-main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}