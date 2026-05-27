import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar }  from './TopBar';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Toaster } from 'react-hot-toast';
import type { Profile } from '../../types';

export function MainLayout() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { setUser, setProfile } = useAuthStore();

  // Al montar: obtener sesión activa y cargar perfil directamente
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;

      // Aseguramos que el store tiene el usuario
      setUser({ id: session.user.id, email: session.user.email! }, null);

      // Buscar perfil directamente con el token de la sesión activa
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('[MC] Error al cargar perfil:', error.message, error.code);
        return;
      }

      if (data) {
        console.log('[MC] Perfil cargado:', data.full_name, '| rol:', data.role);
        setProfile(data as Profile);
      }
    });
  }, []);

  return (
    <div className="flex h-screen bg-surface dark:bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed lg:relative z-30 h-full transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
          duration: 3500,
          style: { borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        }}
      />
    </div>
  );
}
