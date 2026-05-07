import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackToDashboard() {
  return (
    <Link
      to="/dashboard"
      className="inline-flex items-center gap-2 text-sm font-bold text-vital-muted transition hover:text-vital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
    >
      <ArrowLeft size={18} strokeWidth={2.4} />
      Voltar ao Dashboard
    </Link>
  );
}
