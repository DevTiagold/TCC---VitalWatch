import { Eye, EyeOff, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackToDashboard } from '../components/BackToDashboard';
import { patientService } from '../services/patientService';

const initialForm = {
  nome: '',
  idade: '',
  cpf: '',
  email: '',
  telefone: '',
  id_micro: '',
  senha: '',
};

export function RegisterPatientPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await patientService.createPatient({
        email: form.email,
        senha: form.senha,
        nome: form.nome,
        idade: form.idade ? Number(form.idade) : undefined,
        cpf: form.cpf || undefined,
        telefone: form.telefone || undefined,
        id_micro: form.id_micro || undefined,
      });
      navigate('/pacientes');
    } catch (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Nao foi possivel cadastrar o paciente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell max-w-5xl">
      <div className="flex flex-col gap-3">
        <BackToDashboard />
        <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Cadastrar Novo Paciente</h2>
      </div>

      <form className="panel p-6 sm:p-8" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="label">Nome Completo</span>
            <input className="field" type="text" value={form.nome} onChange={(event) => updateField('nome', event.target.value)} required />
          </label>

          <label className="flex flex-col gap-2">
            <span className="label">Idade</span>
            <input className="field" type="number" value={form.idade} onChange={(event) => updateField('idade', event.target.value)} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="label">CPF</span>
            <input className="field" type="text" value={form.cpf} onChange={(event) => updateField('cpf', event.target.value)} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="label">Email do Familiar</span>
            <input className="field" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
          </label>

          <label className="flex flex-col gap-2">
            <span className="label">Telefone</span>
            <input className="field" type="tel" value={form.telefone} onChange={(event) => updateField('telefone', event.target.value)} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="label">ID da Pulseira</span>
            <input className="field" type="text" value={form.id_micro} onChange={(event) => updateField('id_micro', event.target.value)} />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="label">Senha Provisoria</span>
            <div className="relative">
              <input
                className="field pr-12"
                type={showPassword ? 'text' : 'password'}
                value={form.senha}
                onChange={(event) => updateField('senha', event.target.value)}
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
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-vital-red/40 bg-vital-red/10 px-4 py-3 text-sm font-bold text-vital-red">
            {error}
          </div>
        ) : null}

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-vital-blue px-6 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
          >
            <Save size={19} strokeWidth={2.6} />
            {loading ? 'Cadastrando...' : 'Cadastrar Paciente'}
          </button>
        </div>
      </form>
    </div>
  );
}
