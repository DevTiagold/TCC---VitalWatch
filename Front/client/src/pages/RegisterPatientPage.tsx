import { Save } from 'lucide-react';
import { BackToDashboard } from '../components/BackToDashboard';

const fields = [
  { label: 'Nome Completo', type: 'text', placeholder: 'Ex.: Helena Martins' },
  { label: 'Idade', type: 'number', placeholder: 'Ex.: 64' },
  { label: 'CPF', type: 'text', placeholder: '000.000.000-00' },
  { label: 'Email do Familiar', type: 'email', placeholder: 'familiar@email.com' },
  { label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000' },
  { label: 'ID da Pulseira', type: 'text', placeholder: 'VW-0000' },
];

export function RegisterPatientPage() {
  return (
    <div className="page-shell max-w-5xl">
      <div className="flex flex-col gap-3">
        <BackToDashboard />
        <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Cadastrar Novo Paciente</h2>
      </div>

      <form className="panel p-6 sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <label key={field.label} className="flex flex-col gap-2">
              <span className="label">{field.label}</span>
              <input className="field" type={field.type} placeholder={field.placeholder} />
            </label>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-vital-blue px-6 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
          >
            <Save size={19} strokeWidth={2.6} />
            Cadastrar Paciente
          </button>
        </div>
      </form>
    </div>
  );
}
