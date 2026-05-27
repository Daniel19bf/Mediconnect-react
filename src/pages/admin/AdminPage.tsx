import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Shield, BarChart3, Settings, FileText, Activity, UserCircle, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';

const ADMIN_MODULES = [
  { title: 'Usuarios',        desc: 'Crear, editar y bloquear cuentas',   icon: UserCircle, path: '/admin/users',        color: 'bg-primary-500' },
  { title: 'Especialidades',  desc: 'Gestionar especialidades médicas',   icon: Activity,   path: '/admin/specialties',   color: 'bg-medical-teal' },
  { title: 'Reportes',        desc: 'Estadísticas y exportaciones',       icon: BarChart3,  path: '/admin/reports',       color: 'bg-medical-green' },
  { title: 'Auditoría',       desc: 'Historial de actividades',           icon: FileText,   path: '/admin/audit',         color: 'bg-medical-amber' },
  { title: 'Configuración',   desc: 'Ajustes generales del sistema',      icon: Settings,   path: '/admin/config',        color: 'bg-medical-purple' },
  { title: 'Seguridad',       desc: 'Roles, permisos y políticas',        icon: Shield,     path: '/admin/users',         color: 'bg-medical-red' },
];

export default function AdminPage() {
  const { data: counts } = useQuery({
    queryKey: ['admin-counts'],
    queryFn: async () => {
      const [u, p, d] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('doctors').select('*',  { count: 'exact', head: true }).eq('is_available', true),
      ]);
      return { users: u.count ?? 0, patients: p.count ?? 0, doctors: d.count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de administración</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestión completa del sistema MediConnect</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total usuarios', value: counts?.users ?? '—', color: 'text-primary-600' },
          { label: 'Pacientes activos', value: counts?.patients ?? '—', color: 'text-medical-green' },
          { label: 'Médicos disponibles', value: counts?.doctors ?? '—', color: 'text-medical-teal' },
        ].map(s => (
          <Card key={s.label} className="p-5 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Admin modules grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ADMIN_MODULES.map(mod => (
          <Link key={mod.path + mod.title} to={mod.path}>
            <Card hover className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl ${mod.color} flex items-center justify-center flex-shrink-0`}>
                  <mod.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{mod.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{mod.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
