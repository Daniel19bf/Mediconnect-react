import { Bell, Search, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export function TopBar() {
  const { profile } = useAuthStore();
  const { toggleSidebar, sidebarOpen } = useUIStore();
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 flex-shrink-0 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Search */}
      <div className={cn('flex-1 max-w-md transition-all', showSearch ? 'flex' : 'hidden sm:flex')}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pacientes, médicos, citas..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
          />
        </div>
      </div>

      <button
        className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        onClick={() => setShowSearch(s => !s)}
      >
        <Search className="w-5 h-5" />
      </button>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-medical-teal flex items-center justify-center text-white text-sm font-semibold">
            {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">{profile?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
