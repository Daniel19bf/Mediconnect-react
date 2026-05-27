import { useQuery } from '@tanstack/react-query';
import { Shield, Search } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDateTime } from '../../lib/utils';
import type { AuditLog } from '../../types';

const ACTION_COLOR: Record<string, 'info'|'warning'|'danger'|'success'|'default'> = {
  INSERT: 'success', UPDATE: 'warning', DELETE: 'danger', LOGIN: 'info', LOGOUT: 'default',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', search],
    queryFn: async () => {
      let q = supabase.from('audit_logs').select('*, profile:profiles(full_name)').order('created_at', { ascending: false }).limit(100);
      if (search) q = q.ilike('action', `%${search}%`);
      const { data } = await q;
      return data as AuditLog[];
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoría del sistema</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Registro de todas las acciones realizadas</p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar acción..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando registros...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {['Fecha','Usuario','Acción','Tabla','ID Registro'].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {(logs ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Sin registros de auditoría</td></tr>
                ) : (
                  (logs ?? []).map(log => (
                    <tr key={log.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{(log as { profile?: { full_name: string } }).profile?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ACTION_COLOR[log.action] ?? 'default'}>{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{log.table_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.record_id?.slice(0, 8) ?? '—'}...</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
