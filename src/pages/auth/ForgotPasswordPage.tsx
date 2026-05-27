import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resetPassword(email);
      setSent(true);
    } catch {
      toast.error('Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl animate-fade-in">
      <Link to="/login" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al login
      </Link>

      {sent ? (
        <div className="text-center py-4">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">¡Correo enviado!</h2>
          <p className="text-white/70 text-sm">Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-white mb-2">Recuperar contraseña</h2>
          <p className="text-white/70 text-sm mb-6">Ingresa tu correo y te enviaremos las instrucciones.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
              />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
