import { Link, Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/auth';

export function DashboardLayout() {
  const { user } = useAuth();
  const initial = (user?.nome || user?.email || 'A').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 transition-colors dark:bg-[#07111f] dark:text-white">
      <Sidebar />
      <main className="min-h-screen pl-20 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-vital-border bg-white/80 px-5 py-4 backdrop-blur-xl transition-colors dark:bg-[#07111f]/80 sm:px-8 lg:px-10">
          <div className="flex items-center justify-end gap-3">
            <ThemeToggle />
            <Link
              to="/perfil"
              title={user?.email}
              aria-label="Abrir perfil"
              className="grid h-11 w-11 place-items-center rounded-full border border-vital-border bg-vital-panel text-sm font-black text-vital-blue shadow-lg shadow-slate-900/10 transition hover:border-vital-blue/70 hover:bg-vital-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60 dark:shadow-black/20"
            >
              {initial}
            </Link>
          </div>
        </header>
        <div className="px-5 py-7 sm:px-8 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
