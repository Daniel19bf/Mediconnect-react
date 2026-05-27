import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Phone, Mail, MapPin, Calendar, Heart, FileText, Plus, Shield, ArrowLeft } from 'lucide-react';
import { patientsService } from '../../services/patients.service';
import { appointmentsService } from '../../services/appointments.service';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate, formatDateTime } from '../../lib/utils';
import type { AppointmentStatus } from '../../types';

const STATUS_BADGE: Record<AppointmentStatus, { variant: 'warning' | 'info' | 'purple' | 'success' | 'danger' | 'default'; label: string }> = {
  pending:     { variant: 'warning', label: 'Pendiente' },
  confirmed:   { variant: 'info',    label: 'Confirmada' },
  in_progress: { variant: 'purple',  label: 'En proceso' },
  completed:   { variant: 'success', label: 'Completada' },
  cancelled:   { variant: 'danger',  label: 'Cancelada' },
  no_show:     { variant: 'default', label: 'No asistió' },
};

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'appointments'>('info');

  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsService.getById(id!),
    enabled: !!id,
  });

  const { data: appointments, isLoading: isApptsLoading } = useQuery({
    queryKey: ['patient-appointments', id],
    queryFn: () => appointmentsService.getAll({ patient_id: id, pageSize: 20 }),
    enabled: !!id,
  });

  if (isPatientLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl w-32 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-16 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <User className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-base font-medium">Paciente no encontrado</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/patients')}>
          Volver a pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a pacientes
        </button>
        <div className="flex gap-2">
          <Link to={`/patients/${patient.id}/history`}>
            <Button variant="outline" size="sm" icon={<FileText className="w-4 h-4" />}>
              Historia Clínica
            </Button>
          </Link>
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate('/appointments/new', { state: { patientId: patient.id } })}>
            Agendar Cita
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Card Profile */}
        <Card className="border border-gray-100 dark:border-gray-700 shadow-sm h-fit">
          <CardBody className="p-6 flex flex-col items-center text-center">
            <Avatar name={`${patient.first_name} ${patient.last_name}`} src={patient.avatar_url} size="xl" />
            <h2 className="font-bold text-xl text-gray-900 dark:text-white mt-4">
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {patient.document_type} {patient.document_number}
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <Badge variant="purple">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</Badge>
              {patient.blood_type && <Badge variant="danger">Ocupación: {patient.blood_type}</Badge>}
              <Badge>{patient.age} años</Badge>
            </div>
            
            {patient.notes && (
              <div className="w-full mt-6 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl p-3.5 text-left">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wide">Notas Médicas</p>
                <p className="text-sm text-amber-900 dark:text-amber-300 mt-1 italic">
                  {patient.notes}
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Right Column - Details and Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 px-6 py-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors -mb-[2px] ${activeTab === 'info' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                Información Detallada
              </button>
              <button
                onClick={() => setActiveTab('appointments')}
                className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors -mb-[2px] ${activeTab === 'appointments' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                Historial de Citas
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6">
              {activeTab === 'info' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 pb-2">
                      <Phone className="w-4 h-4 text-primary-500" /> Datos de Contacto
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400">Teléfono</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Correo Electrónico</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Dirección</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {patient.address ? `${patient.address}, ${patient.city || ''}` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical / EPS */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 pb-2">
                      <Shield className="w-4 h-4 text-primary-500" /> Afiliación y Salud
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-400">Entidad de Salud (EPS)</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.eps || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Grupo Sanguíneo</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.blood_type || 'Sin definir'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Fecha de Nacimiento</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDate(patient.birth_date)} ({patient.age} años)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="md:col-span-2 space-y-4 mt-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 pb-2">
                      <Heart className="w-4 h-4 text-red-500" /> Contacto de Emergencia
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">Nombre de Contacto</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.emergency_contact || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Teléfono de Contacto</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.emergency_phone || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Appointments Tab */
                isApptsLoading ? (
                  <div className="py-8 text-center text-gray-400 text-sm animate-pulse">Cargando citas...</div>
                ) : (appointments?.data ?? []).length === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                    <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    Este paciente no tiene citas registradas.
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {(appointments?.data ?? []).map(appt => (
                      <li key={appt.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            Dr. {appt.doctor?.profile?.full_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {appt.specialty?.name} · {appt.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {formatDateTime(appt.scheduled_at)}
                          </p>
                          <Badge variant={STATUS_BADGE[appt.status]?.variant ?? 'default'} className="mt-1">
                            {STATUS_BADGE[appt.status]?.label ?? appt.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
