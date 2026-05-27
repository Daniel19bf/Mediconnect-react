import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Activity, Chrome } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await authService.signIn(data.email, data.password);
      if (result.user) {
        const profile = await authService.getProfile(result.user.id);
        setUser({ id: result.user.id, email: result.user.email! }, profile);
        toast.success(`¡Bienvenido${profile?.full_name ? ', ' + profile.full_name.split(' ')[0] : ''}!`);
        navigate(from, { replace: true });
      }
    } catch {
      toast.error('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }
  };

  const handleGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch {
      toast.error('Error al iniciar sesión con Google');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">MediConnect</h1>
        <p className="text-white/70 text-sm">Sistema Médico Profesional</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-1.5">Correo electrónico</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="email"
              placeholder="medico@clinica.com"
              {...register('email')}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent text-sm transition-all"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-white/90 mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent text-sm transition-all"
            />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>}
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" {...register('remember')} className="rounded border-white/30 bg-white/10" />
            Recordarme
          </label>
          <Link to="/forgot-password" className="text-sm text-white/70 hover:text-white transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-white text-primary-700 font-semibold text-sm hover:bg-white/90 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {isSubmitting ? <span className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /> : null}
          {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-white/40 text-xs">o continúa con</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>

      <button
        onClick={handleGoogle}
        className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2"
      >
        <Chrome className="w-4 h-4" />
        Google
      </button>

      <p className="text-center text-white/50 text-xs mt-6">
        © {new Date().getFullYear()} MediConnect · Todos los derechos reservados
      </p>
    </div>
  );
}
