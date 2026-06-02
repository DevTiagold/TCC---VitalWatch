import { Activity, Eye, EyeOff, LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/auth';

export function Login() {
  const { isAuthenticated, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const from = typeof location.state === 'object' && location.state && 'from' in location.state ? String(location.state.from) : '/dashboard';

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      await login({ email, senha });
      navigate(from, { replace: true });
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Falha ao realizar login.');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-vital-bg px-5 py-10 text-vital-text transition-colors">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <section className="panel w-full max-w-md p-7 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-xl bg-vital-blue/16 text-vital-blue ring-1 ring-vital-blue/30">
            <Activity size={34} strokeWidth={2.6} />
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-normal text-vital-text">VitalWatch</h1>
          <h2 className="mt-7 text-2xl font-black tracking-normal text-vital-text">Acesso Hospitalar</h2>
          <p className="mt-2 text-sm font-bold text-vital-muted">Entre para acessar o painel de monitoramento</p>
        </div>

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="label">Email</span>
            <input
              className="field"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="label">Senha</span>
            <div className="relative">
              <input
                className="field pr-12"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-vital-muted transition hover:bg-vital-card-soft hover:text-vital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
              >
                {showPassword ? <EyeOff size={19} strokeWidth={2.4} /> : <Eye size={19} strokeWidth={2.4} />}
              </button>
            </div>
          </label>

          {error ? (
            <div className="rounded-lg border border-vital-red/40 bg-vital-red/10 px-4 py-3 text-sm font-bold text-vital-red">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-vital-blue px-6 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
          >
            <LogIn size={19} strokeWidth={2.6} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  );
}
