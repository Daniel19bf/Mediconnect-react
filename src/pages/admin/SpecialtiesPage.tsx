import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import type { Specialty } from '../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function SpecialtiesPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'create'|'edit'|null>(null);
  const [selected, setSelected] = useState<Specialty|null>(null);

  const { data: specialties, isLoading } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data } = await supabase.from('specialties').select('*').order('name');
      return data as Specialty[];
    },
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<Specialty>>();

  const upsert = useMutation({
    mutationFn: async (d: Partial<Specialty>) => {
      if (selected) {
        await supabase.from('specialties').update(d).eq('id', selected.id);
      } else {
        await supabase.from('specialties').insert({ ...d, is_active: true });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['specialties'] }); toast.success('Especialidad guardada'); setModal(null); reset(); setSelected(null); },
    onError: () => toast.error('Error al guardar'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => supabase.from('specialties').update({ is_active: false }).eq('id', id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specialties'] }),
  });

  const openEdit = (s: Specialty) => { setSelected(s); reset(s); setModal('edit'); };
  const openCreate = () => { setSelected(null); reset({}); setModal('create'); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Especialidades médicas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{specialties?.length ?? 0} especialidades</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Nueva especialidad</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? Array.from({length:6}).map((_,i) => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />) :
          (specialties ?? []).map(s => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + '20' }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-gray-400 hover:text-yellow-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove.mutate(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <Badge variant={s.is_active ? 'success' : 'danger'}>{s.is_active ? 'Activa' : 'Inactiva'}</Badge>
              </div>
            </Card>
          ))
        }
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'Nueva especialidad' : 'Editar especialidad'} size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button loading={isSubmitting} form="specialty-form" type="submit">Guardar</Button>
          </>
        }>
        <form id="specialty-form" onSubmit={handleSubmit(d => upsert.mutate(d))} className="space-y-4">
          <Input label="Nombre" required {...register('name')} />
          <Input label="Descripción" {...register('description')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
            <input type="color" {...register('color')} defaultValue="#1a56db" className="h-10 w-full rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer p-1" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
