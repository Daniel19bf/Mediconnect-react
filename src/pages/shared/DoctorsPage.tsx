import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, Edit, Stethoscope, Star, CheckCircle, XCircle } from 'lucide-react';
import { doctorsService } from '../../services/doctors.service';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../../lib/utils';
import type { Doctor, Specialty, Profile } from '../../types';
import toast from 'react-hot-toast';

interface DoctorFormData {
  profile_id: string;
  specialty_id: string;
  license_number: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  is_available: boolean;
}

export default function DoctorsPage() {
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Doctor | null>(null);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, specialtyFilter],
    queryFn: () => doctorsService.getAll({ search, specialty_id: specialtyFilter || undefined, pageSize: 50 }),
  });

  const { data: specialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data } = await supabase.from('specialties').select('*').eq('is_active', true).order('name');
      return data as Specialty[];
    },
  });

  const { data: unlinkedProfiles } = useQuery({
    queryKey: ['unlinked-doctor-profiles', modal],
    queryFn: async () => {
      // Get all profiles with doctor role
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'doctor');
      // Get all existing doctor records
      const { data: doctors } = await supabase.from('doctors').select('profile_id');
      const linkedIds = new Set((doctors ?? []).map(d => d.profile_id));
      // Filter out profiles that are already linked to a doctor
      return (profiles ?? []).filter(p => !linkedIds.has(p.id)) as Profile[];
    },
    enabled: modal === 'create',
  });

  // Forms
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DoctorFormData>();

  // Mutations
  const upsertMutation = useMutation({
    mutationFn: async (formData: DoctorFormData) => {
      if (selected) {
        const { profile_id, ...updates } = formData;
        await doctorsService.update(selected.id, updates);
      } else {
        await doctorsService.create({
          profile_id: formData.profile_id,
          specialty_id: formData.specialty_id || undefined,
          license_number: formData.license_number,
          experience_years: Number(formData.experience_years),
          consultation_fee: Number(formData.consultation_fee),
          bio: formData.bio || '',
          is_available: formData.is_available,
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctors'] });
      toast.success(selected ? 'Médico actualizado con éxito' : 'Médico registrado con éxito');
      setModal(null);
      setSelected(null);
      reset();
    },
    onError: () => {
      toast.error('Ocurrió un error al guardar los datos del médico');
    },
  });

  const openCreate = () => {
    setSelected(null);
    reset({
      profile_id: '',
      specialty_id: '',
      license_number: '',
      experience_years: 1,
      consultation_fee: 50000,
      bio: '',
      is_available: true,
    });
    setModal('create');
  };

  const openEdit = (doctor: Doctor) => {
    setSelected(doctor);
    reset({
      profile_id: doctor.profile_id,
      specialty_id: doctor.specialty_id ?? '',
      license_number: doctor.license_number,
      experience_years: doctor.experience_years,
      consultation_fee: doctor.consultation_fee,
      bio: doctor.bio ?? '',
      is_available: doctor.is_available,
    });
    setModal('edit');
  };

  const onSubmit = (formData: DoctorFormData) => {
    upsertMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipo de Médicos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data?.count ?? 0} profesionales registrados
          </p>
        </div>
        {role === 'admin' && (
          <Button icon={<Plus className="w-4.5 h-4.5" />} onClick={openCreate}>
            Registrar Médico
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o número de licencia..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas las especialidades</option>
            {specialties?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (data?.data ?? []).length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Stethoscope className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 animate-bounce" />
          <p className="text-base font-medium">No se encontraron médicos</p>
          <p className="text-sm text-gray-400 mt-1">Prueba a cambiar los términos de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.data ?? []).map(doctor => (
            <Card key={doctor.id} className="overflow-hidden flex flex-col justify-between h-full border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar name={doctor.profile?.full_name ?? 'Médico'} src={doctor.profile?.avatar_url} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">
                        Dr. {doctor.profile?.full_name}
                      </h3>
                      {doctor.is_available ? (
                        <span className="inline-flex items-center text-green-600 dark:text-green-400" title="Disponible">
                          <CheckCircle className="w-4 h-4 fill-green-50 dark:fill-transparent" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-400" title="No disponible">
                          <XCircle className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-0.5">
                      {doctor.specialty?.name ?? 'Sin Especialidad'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Lic. {doctor.license_number}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {doctor.rating ? doctor.rating.toFixed(1) : '—'}
                    </span>
                    <span className="text-xs text-gray-400">({doctor.total_reviews ?? 0})</span>
                  </div>
                  <div className="text-xs text-gray-400">•</div>
                  <div>
                    <span className="font-semibold text-gray-950 dark:text-white">{doctor.experience_years}</span> años de exp.
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 italic">
                  {doctor.bio || '"Sin descripción profesional disponible."'}
                </p>
              </div>

              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Tarifa Consulta</p>
                  <p className="font-bold text-gray-900 dark:text-white text-base">
                    {formatCurrency(doctor.consultation_fee)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {role === 'admin' && (
                    <Button variant="outline" size="sm" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEdit(doctor)}>
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal CRUD */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Registrar Nuevo Médico' : 'Editar Datos del Médico'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
            <Button loading={isSubmitting} form="doctor-form" type="submit">
              {modal === 'create' ? 'Registrar' : 'Guardar Cambios'}
            </Button>
          </>
        }
      >
        <form id="doctor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {modal === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Seleccionar Perfil de Usuario *
              </label>
              <select
                required
                {...register('profile_id', { required: 'Debe seleccionar un perfil' })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecciona un usuario médico...</option>
                {unlinkedProfiles?.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.phone || 'Sin Teléfono'})</option>
                ))}
              </select>
              {errors.profile_id && <p className="text-red-500 text-xs mt-1">{errors.profile_id.message}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Especialidad Médica *
            </label>
            <select
              required
              {...register('specialty_id', { required: 'Debe seleccionar una especialidad' })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecciona especialidad...</option>
              {specialties?.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.specialty_id && <p className="text-red-500 text-xs mt-1">{errors.specialty_id.message}</p>}
          </div>

          <Input
            label="Número de Licencia / Registro Médico"
            required
            placeholder="Ej. MP-84930"
            {...register('license_number', { required: 'Requerido' })}
            error={errors.license_number?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Años de Experiencia"
              type="number"
              required
              min={0}
              {...register('experience_years', { required: 'Requerido', valueAsNumber: true })}
              error={errors.experience_years?.message}
            />
            <Input
              label="Tarifa Consulta ($)"
              type="number"
              required
              min={0}
              {...register('consultation_fee', { required: 'Requerido', valueAsNumber: true })}
              error={errors.consultation_fee?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Biografía / Resumen Profesional
            </label>
            <textarea
              placeholder="Escribe una breve descripción del perfil profesional del médico..."
              {...register('bio')}
              rows={3}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              {...register('is_available')}
              className="w-4.5 h-4.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_available" className="text-sm text-gray-700 dark:text-gray-300">
              Disponible para recibir citas
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
