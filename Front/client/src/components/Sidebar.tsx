import { Activity, LayoutDashboard, LogOut, UserRound, UserRoundPlus, UsersRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Pacientes', to: '/pacientes', icon: UsersRound },
  { label: 'Cadastrar Paciente', to: '/cadastrar-paciente', icon: UserRoundPlus },
  { label: 'Perfil', to: '/perfil', icon: UserRound },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-20 flex-col border-r border-vital-border bg-vital-sidebar px-3 py-5 shadow-2xl shadow-black/25 lg:w-72 lg:px-6">
      <div className="flex items-center gap-3 lg:items-start">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-vital-blue/16 text-vital-blue ring-1 ring-vital-blue/30">
          <Activity size={27} strokeWidth={2.6} />
        </div>
        <div className="hidden min-w-0 lg:block">
          <h1 className="truncate text-2xl font-black tracking-normal text-vital-text">VitalWatch</h1>
          <p className="mt-1 text-sm font-semibold text-vital-muted">Sistema de Monitoramento</p>
        </div>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.label}
              className={({ isActive }) =>
                [
                  'flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60',
                  isActive
                    ? 'bg-vital-blue text-white shadow-lg shadow-vital-blue/20'
                    : 'text-vital-muted hover:bg-vital-card hover:text-vital-text',
                ].join(' ')
              }
            >
              <Icon className="mx-auto h-5 w-5 shrink-0 lg:mx-0" strokeWidth={2.4} />
              <span className="hidden truncate lg:inline">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        title="Logout"
        onClick={handleLogout}
        className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold text-vital-muted transition hover:bg-vital-card hover:text-vital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
      >
        <LogOut className="mx-auto h-5 w-5 shrink-0 lg:mx-0" strokeWidth={2.4} />
        <span className="hidden lg:inline">Logout</span>
      </button>
    </aside>
  );
}
