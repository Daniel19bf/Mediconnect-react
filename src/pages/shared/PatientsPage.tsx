import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, User } from 'lucide-react';
import { patientsService } from '../../services/patients.service';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { formatDate, calcAge } from '../../lib/utils';
import type { Patient, Gender, BloodType } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const schema = z.object({
  first_name:      z.string().min(2, 'Requerido'),
  last_name:       z.string().min(2, 'Requerido'),
  document_type:   z.string().default('CC'),
  document_number: z.string().min(5, 'Requerido'),
  birth_date:      z.string().min(1, 'Requerida'),
  gender:          z.enum(['male','female','other']),
  blood_type:      z.string().optional(),
  email:           z.string().email('Inválido').optional().or(z.literal('')),
  phone:           z.string().optional(),
  address:         z.string().optional(),
  city:            z.string().optional(),
  eps:             z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes:           z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function PatientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage]   = useState(1);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Patient | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () => patientsService.getAll({ search, page, pageSize: 15 }),
    placeholderData: prev => prev,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (d: FormData) => patientsService.create({ ...d, is_active: true } as Parameters<typeof patientsService.create>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); toast.success('Paciente creado'); setModal(null); reset(); },
    onError: () => toast.error('Error al crear paciente'),
  });

  const openCreate = () => { reset(); setModal('create'); };
  const openEdit   = (p: Patient) => { setSelected(p); reset({ ...p, gender: p.gender as Gender, blood_type: p.blood_type as BloodType }); setModal('edit'); };

  const columns = [
    {
      key: 'name', header: 'Paciente',
      render: (p: Patient) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${p.first_name} ${p.last_name}`} src={p.avatar_url} size="sm" />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{p.first_name} {p.last_name}</p>
            <p className="text-xs text-gray-400">{p.document_type} {p.document_number}</p>
          </div>
        </div>
      ),
    },
    { key: 'age', header: 'Edad', render: (p: Patient) => `${calcAge(p.birth_date)} años` },
    { key: 'gender', header: 'Género', render: (p: Patient) => ({ male:'Masculino', female:'Femenino', other:'Otro' }[p.gender]) },
    { key: 'eps', header: 'EPS', render: (p: Patient) => p.eps || <span className="text-gray-300">—</span> },
    { key: 'blood_type', header: 'Sangre', render: (p: Patient) => p.blood_type ? <Badge>{p.blood_type}</Badge> : <span className="text-gray-300">—</span> },
    { key: 'phone', header: 'Teléfono', render: (p: Patient) => p.phone || <span className="text-gray-300">—</span> },
    {
      key: 'actions', header: 'Acciones',
      render: (p: Patient) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/patients/${p.id}`)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-600 transition-colors" title="Ver">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-gray-400 hover:text-yellow-600 transition-colors" title="Editar">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data?.count ?? 0} registros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>Exportar</Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Nuevo paciente</Button>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, documento, correo..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
          <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>Filtros</Button>
        </div>

        <Table
          columns={columns}
          data={data?.data ?? []}
          keyField="id"
          loading={isLoading}
          emptyMessage="No se encontraron pacientes"
        />

        {/* Pagination */}
        {(data?.count ?? 0) > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500">Página {page} de {Math.ceil((data?.count ?? 0) / 15)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil((data?.count ?? 0) / 15)} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nuevo paciente' : 'Editar paciente'}
        size="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button loading={isSubmitting} form="patient-form" type="submit">
              {modal === 'create' ? 'Crear paciente' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <form id="patient-form" onSubmit={handleSubmit(d => createMutation.mutate(d))} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombres" required {...register('first_name')} error={errors.first_name?.message} />
          <Input label="Apellidos" required {...register('last_name')} error={errors.last_name?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo documento *</label>
            <select {...register('document_type')} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="CE">Cédula Extranjería</option>
              <option value="PP">Pasaporte</option>
              <option value="RC">Registro Civil</option>
            </select>
          </div>
          <Input label="Número de documento" required {...register('document_number')} error={errors.document_number?.message} />
          <Input label="Fecha de nacimiento" type="date" required {...register('birth_date')} error={errors.birth_date?.message} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Género *</label>
            <select {...register('gender')} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tipo de sangre</label>
            <select {...register('blood_type')} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Sin definir</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input label="EPS" {...register('eps')} />
          <Input label="Correo electrónico" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Teléfono" {...register('phone')} />
          <Input label="Ciudad" {...register('city')} />
          <Input label="Dirección" {...register('address')} className="sm:col-span-2" />
          <Input label="Contacto de emergencia" {...register('emergency_contact')} />
          <Input label="Teléfono emergencia" {...register('emergency_phone')} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notas</label>
            <textarea {...register('notes')} rows={3} className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </form>
      </Modal>
    </div>
  );
}
