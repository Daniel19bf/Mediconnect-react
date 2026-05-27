import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SystemConfigPage() {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: configs, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: async () => {
      const { data } = await supabase.from('system_config').select('*').order('key');
      const map: Record<string, string> = {};
      (data ?? []).forEach((c: { key: string; value: unknown }) => { map[c.key] = String(c.value).replace(/^"|"$/g, ''); });
      setValues(map);
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(values).map(([key, value]) =>
        supabase.from('system_config').update({ value: JSON.stringify(value) }).eq('key', key)
      );
      await Promise.all(updates);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-config'] }); toast.success('Configuración guardada'); },
    onError: () => toast.error('Error al guardar configuración'),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración del sistema</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ajustes generales de MediConnect</p>
          </div>
        </div>
        <Button icon={<Save className="w-4 h-4" />} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          Guardar cambios
        </Button>
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold text-gray-900 dark:text-white">Parámetros del sistema</h3></CardHeader>
        <CardBody>
          {isLoading ? <div className="text-gray-400 text-sm">Cargando...</div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(values).map(([key, value]) => (
                <Input
                  key={key}
                  label={key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  value={value}
                  onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value }))}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
