import { Save } from 'lucide-react';
import { BackToDashboard } from '../components/BackToDashboard';

export function AdminProfilePage() {
  return (
    <div className="page-shell max-w-4xl">
      <div className="flex flex-col gap-3">
        <BackToDashboard />
        <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Perfil do Administrador</h2>
      </div>

      <section className="panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 border-b border-vital-border pb-7 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-vital-blue/16 text-3xl font-black text-vital-blue ring-1 ring-vital-blue/30">
            A
          </div>
          <div>
            <h3 className="text-2xl font-black text-vital-text">Admin VitalWatch</h3>
            <p className="mt-1 text-sm font-bold text-vital-muted">Administrador do Sistema</p>
          </div>
        </div>

        <form className="mt-7 grid gap-5">
          <label className="flex flex-col gap-2">
            <span className="label">Nome Completo</span>
            <input className="field" type="text" defaultValue="Admin VitalWatch" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="label">Email</span>
            <input className="field" type="email" defaultValue="admin@vitalwatch.com" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="label">Alterar Senha</span>
            <input className="field" type="password" placeholder="Nova senha" />
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-vital-blue px-6 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
            >
              <Save size={19} strokeWidth={2.6} />
              Salvar Alterações
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
