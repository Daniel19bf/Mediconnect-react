import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await authService.updatePassword(password);
      toast.success('Contraseña actualizada');
      navigate('/login');
    } catch {
      toast.error('Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl animate-fade-in">
      <h2 className="text-xl font-bold text-white mb-6">Nueva contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[{ label: 'Nueva contraseña', val: password, set: setPassword }, { label: 'Confirmar contraseña', val: confirm, set: setConfirm }].map(f => (
          <div key={f.label} className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="password" required value={f.val} onChange={e => f.set(e.target.value)}
              placeholder={f.label} minLength={6}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
            />
          </div>
        ))}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  );
}
