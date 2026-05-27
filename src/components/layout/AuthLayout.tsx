import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-medical-teal flex items-center justify-center p-4">
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-40 h-40 bg-medical-teal/20 rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
