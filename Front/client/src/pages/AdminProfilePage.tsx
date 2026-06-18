import { Eye, EyeOff, LogOut, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackToDashboard } from '../components/BackToDashboard';
import { useAuth } from '../context/auth';
import { authService } from '../services/authService';

export function AdminProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const initial = (user?.nome || user?.email || 'A').charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authService.changePassword(senhaAtual, novaSenha);
      setMessage(response.message);
      setSenhaAtual('');
      setNovaSenha('');
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Nao foi possivel alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell max-w-4xl">
      <div className="flex flex-col gap-3">
        <BackToDashboard />
        <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Perfil do Administrador</h2>
      </div>

      <section className="panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 border-b border-vital-border pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-vital-blue/16 text-3xl font-black text-vital-blue ring-1 ring-vital-blue/30">
              {initial}
            </div>
            <div>
              <h3 className="text-2xl font-black text-vital-text">{user?.nome || 'Usuario VitalWatch'}</h3>
              <p className="mt-1 text-sm font-bold text-vital-muted">{user?.role || 'Usuario do Sistema'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-vital-border px-4 text-sm font-black text-vital-muted transition hover:border-vital-red/60 hover:text-vital-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
          >
            <LogOut size={18} strokeWidth={2.5} />
            Logout
          </button>
        </div>

        <form className="mt-7 grid gap-5" onSubmit={handlePasswordChange}>
          <label className="flex flex-col gap-2">
            <span className="label">Nome Completo</span>
            <input className="field" type="text" value={user?.nome || ''} readOnly />
          </label>
          <label className="flex flex-col gap-2">
            <span className="label">Email</span>
            <input className="field" type="email" value={user?.email || ''} readOnly />
          </label>
          <label className="flex flex-col gap-2">
            <span className="label">Senha Atual</span>
            <div className="relative">
              <input
                className="field pr-12"
                type={showCurrentPassword ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(event) => setSenhaAtual(event.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                title={showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
                onClick={() => setShowCurrentPassword((currentValue) => !currentValue)}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-vital-muted transition hover:bg-vital-card-soft hover:text-vital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
              >
                {showCurrentPassword ? <EyeOff size={19} strokeWidth={2.4} /> : <Eye size={19} strokeWidth={2.4} />}
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-2">
            <span className="label">Nova Senha</span>
            <div className="relative">
              <input
                className="field pr-12"
                type={showNewPassword ? 'text' : 'password'}
                value={novaSenha}
                onChange={(event) => setNovaSenha(event.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                title={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                onClick={() => setShowNewPassword((currentValue) => !currentValue)}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-vital-muted transition hover:bg-vital-card-soft hover:text-vital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
              >
                {showNewPassword ? <EyeOff size={19} strokeWidth={2.4} /> : <Eye size={19} strokeWidth={2.4} />}
              </button>
            </div>
          </label>

          {message ? <div className="rounded-lg bg-vital-green/12 px-4 py-3 text-sm font-bold text-vital-green">{message}</div> : null}
          {error ? <div className="rounded-lg bg-vital-red/10 px-4 py-3 text-sm font-bold text-vital-red">{error}</div> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-vital-blue px-6 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
            >
              <Save size={19} strokeWidth={2.6} />
              {loading ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
