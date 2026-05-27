import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Shield, UserCheck, UserX, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { authService } from '../../services/auth.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../lib/utils';
import type { Profile, UserRole } from '../../types';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

const schema = z.object({
  full_name: z.string().min(3),
  email:     z.string().email(),
  password:  z.string().min(8, 'Mínimo 8 caracteres'),
  role:      z.enum(['admin','doctor','patient']),
});
type FormData = z.infer<typeof schema>;

const ROLE_BADGE: Record<UserRole, { variant: 'info' | 'success' | 'warning'; label: string }> = {
  admin:   { variant: 'warning', label: 'Administrador' },
  doctor:  { variant: 'info',    label: 'Médico' },
  patient: { variant: 'success', label: 'Paciente' },
};

export default function UsersAdminPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (search) q = q.ilike('full_name', `%${search}%`);
      const { data } = await q;
      return data as Profile[];
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => authService.createUser(d.email, d.password, d.role, d.full_name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario creado');
      setModal(false);
      reset();
    },
    onError: () => toast.error('Error al crear usuario'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('profiles').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios del sistema</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{users?.length ?? 0} usuarios registrados</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setModal(true)}>Nuevo usuario</Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando usuarios...</div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {(users ?? []).map(u => (
              <li key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <Avatar name={u.full_name} src={u.avatar_url} size="md" online={u.is_active} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">{u.full_name}</p>
                  <p className="text-xs text-gray-400">Creado: {formatDate(u.created_at)}</p>
                </div>
                <Badge variant={ROLE_BADGE[u.role]?.variant ?? 'default'} dot>
                  {ROLE_BADGE[u.role]?.label ?? u.role}
                </Badge>
                <Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Activo' : 'Inactivo'}</Badge>
                <button
                  onClick={() => toggleActive.mutate({ id: u.id, active: !u.is_active })}
                  className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'hover:bg-red-50 hover:text-red-500 text-gray-400' : 'hover:bg-green-50 hover:text-green-500 text-gray-400'}`}
                  title={u.is_active ? 'Desactivar' : 'Activar'}
                >
                  {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Crear nuevo usuario" size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button loading={isSubmitting} form="user-form" type="submit">Crear usuario</Button>
          </>
        }>
        <form id="user-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <Input label="Nombre completo" required {...register('full_name')} error={errors.full_name?.message} />
          <Input label="Correo electrónico" type="email" required {...register('email')} error={errors.email?.message} />
          <Input label="Contraseña temporal" type="password" required {...register('password')} error={errors.password?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rol del usuario *</label>
            <select {...register('role')} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="patient">Paciente</option>
              <option value="doctor">Médico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
