import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Video, Search, Clock, CheckCircle, XCircle, User, Stethoscope } from 'lucide-react';
import { appointmentsService } from '../../services/appointments.service';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime, APPOINTMENT_STATUS_LABELS } from '../../lib/utils';
import type { Appointment, AppointmentStatus } from '../../types';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

const STATUS_TABS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Confirmadas', value: 'confirmed' },
  { label: 'En proceso', value: 'in_progress' },
  { label: 'Completadas', value: 'completed' },
  { label: 'Canceladas', value: 'cancelled' },
];

const STATUS_BADGE_MAP: Record<string, { variant: 'warning' | 'info' | 'purple' | 'success' | 'danger' | 'default' }> = {
  pending:     { variant: 'warning' },
  confirmed:   { variant: 'info' },
  in_progress: { variant: 'purple' },
  completed:   { variant: 'success' },
  cancelled:   { variant: 'danger' },
  no_show:     { variant: 'default' },
};

export default function AppointmentsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'all'>('all');
  const [cancelModal, setCancelModal] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', activeTab],
    queryFn: () => appointmentsService.getAll({
      status: activeTab === 'all' ? undefined : activeTab,
      pageSize: 30,
    }),
    refetchInterval: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsService.updateStatus(id, 'cancelled', reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita cancelada');
      setCancelModal(null);
      setCancelReason('');
    },
    onError: () => toast.error('Error al cancelar la cita'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.updateStatus(id, 'confirmed'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Cita confirmada'); },
  });

  const filtered = (data?.data ?? []).filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase().includes(q) ||
      a.doctor?.profile?.full_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Citas médicas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data?.count ?? 0} citas en total</p>
        </div>
        <Link to="/appointments/new">
          <Button icon={<Plus className="w-4 h-4" />}>Nueva cita</Button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar paciente o médico..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando citas...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No hay citas para mostrar</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map(appt => (
              <li key={appt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <Avatar name={`${appt.patient?.first_name} ${appt.patient?.last_name}`} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {appt.patient?.first_name} {appt.patient?.last_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      Dr. {appt.doctor?.profile?.full_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(appt.scheduled_at)}
                    </span>
                    {appt.type === 'videollamada' && (
                      <span className="flex items-center gap-1 text-primary-600">
                        <Video className="w-3 h-3" /> Videollamada
                      </span>
                    )}
                  </div>
                  {appt.reason && <p className="text-xs text-gray-400 mt-0.5 truncate">{appt.reason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE_MAP[appt.status]?.variant ?? 'default'}>
                    {APPOINTMENT_STATUS_LABELS[appt.status]}
                  </Badge>
                  {appt.status === 'pending' && (
                    <button
                      onClick={() => confirmMutation.mutate(appt.id)}
                      className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600 transition-colors"
                      title="Confirmar"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {appt.type === 'videollamada' && ['confirmed','in_progress'].includes(appt.status) && (
                    <Link to={`/video/${appt.id}`}>
                      <button className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-600 transition-colors" title="Unirse">
                        <Video className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                  {!['completed','cancelled','no_show'].includes(appt.status) && (
                    <button
                      onClick={() => setCancelModal(appt)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      title="Cancelar"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Cancel modal */}
      <Modal
        open={!!cancelModal}
        onClose={() => setCancelModal(null)}
        title="Cancelar cita"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelModal(null)}>Volver</Button>
            <Button variant="danger" loading={cancelMutation.isPending} onClick={() => cancelModal && cancelMutation.mutate({ id: cancelModal.id, reason: cancelReason })}>
              Cancelar cita
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">¿Por qué se cancela esta cita?</p>
        <textarea
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          rows={3}
          placeholder="Motivo de cancelación..."
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </Modal>
    </div>
  );
}
