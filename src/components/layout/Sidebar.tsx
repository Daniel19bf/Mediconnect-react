import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCircle, Calendar, FileText,
  Video, MessageSquare, Pill, FlaskConical, Settings,
  Shield, BarChart3, Stethoscope, ChevronLeft, ChevronRight,
  LogOut, Bell, Moon, Sun, Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { authService } from '../../services/auth.service';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard',    icon: LayoutDashboard, roles: ['admin','doctor','patient'] },
  { label: 'Pacientes',       path: '/patients',     icon: Users,           roles: ['admin','doctor'] },
  { label: 'Médicos',         path: '/doctors',      icon: Stethoscope,     roles: ['admin'] },
  { label: 'Citas',           path: '/appointments', icon: Calendar,        roles: ['admin','doctor','patient'] },
  { label: 'Historia Clínica',path: '/patients',     icon: FileText,        roles: ['patient'] },
  { label: 'Recetas',         path: '/prescriptions',icon: Pill,            roles: ['doctor','patient'] },
  { label: 'Resultados',      path: '/results',      icon: FlaskConical,    roles: ['doctor','patient'] },
  { label: 'Videollamadas',   path: '/appointments', icon: Video,           roles: ['doctor','patient'] },
  { label: 'Chat',            path: '/chat',         icon: MessageSquare,   roles: ['admin','doctor','patient'] },
  { label: 'Administración',  path: '/admin',        icon: Shield,          roles: ['admin'] },
  { label: 'Usuarios',        path: '/admin/users',  icon: UserCircle,      roles: ['admin'] },
  { label: 'Especialidades',  path: '/admin/specialties', icon: Activity,   roles: ['admin'] },
  { label: 'Reportes',        path: '/admin/reports',icon: BarChart3,       roles: ['admin'] },
  { label: 'Auditoría',       path: '/admin/audit',  icon: Settings,        roles: ['admin'] },
];

export function Sidebar() {
  const { profile, role, clearAuth } = useAuthStore();
  const { sidebarCollapsed, toggleCollapsed, darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();

  const filteredNav = NAV_ITEMS.filter(item => role && item.roles.includes(role));

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (_) { /* ignorar errores */ }
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-300 shadow-sidebar',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-medical-teal flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">MediConnect</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Sistema Médico</p>
            </div>
          )}
        </div>
        <button
          onClick={toggleCollapsed}
          className="ml-auto p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {filteredNav.map(item => (
          <NavLink
            key={item.path + item.label}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                sidebarCollapsed && 'justify-center'
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-primary-600 dark:text-primary-400' : '')} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {item.badge && !sidebarCollapsed && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
                {sidebarCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 space-y-2 flex-shrink-0">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
            sidebarCollapsed && 'justify-center'
          )}
          title={sidebarCollapsed ? (darkMode ? 'Modo claro' : 'Modo oscuro') : undefined}
        >
          {darkMode ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          {!sidebarCollapsed && <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>

        {/* User profile */}
        <div className={cn('flex items-center gap-3 px-3 py-2 rounded-xl', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-medical-teal flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={handleSignOut}
              className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
