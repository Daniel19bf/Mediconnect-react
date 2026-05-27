import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, User, Stethoscope, Video, ChevronRight, CheckCircle2, ArrowLeft, Search, Clock } from 'lucide-react';
import { doctorsService } from '../../services/doctors.service';
import { appointmentsService } from '../../services/appointments.service';
import { patientsService } from '../../services/patients.service';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Specialty, Doctor, Patient } from '../../types';
import toast from 'react-hot-toast';

export default function NewAppointmentPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, role } = useAuthStore();
  const isMedicalStaff = role === 'admin' || role === 'doctor';

  // Navigation state state patientId
  const statePatientId = location.state?.patientId as string | undefined;

  // Wizard Steps
  // Steps: 1: Patient (if admin/doctor), 2: Specialty & Doctor, 3: Date & Slots, 4: Reason & Confirmation
  const [step, setStep] = useState(isMedicalStaff && !statePatientId ? 1 : 2);

  // Selections
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'presencial' | 'videollamada'>('presencial');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Search terms for admin patient selector
  const [patientSearch, setPatientSearch] = useState('');

  // Fetch Patient if role is patient
  const { data: myPatientRecord, isLoading: isMyPatientLoading } = useQuery({
    queryKey: ['my-patient-record', profile?.id],
    queryFn: async () => {
      if (role !== 'patient') return null;
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', profile?.id)
        .single();
      if (error) throw error;
      return data as Patient;
    },
    enabled: role === 'patient' && !!profile?.id,
  });

  // Fetch Patient from state
  const { data: statePatient, isLoading: isStatePatientLoading } = useQuery({
    queryKey: ['patient', statePatientId],
    queryFn: () => patientsService.getById(statePatientId!),
    enabled: !!statePatientId,
  });

  // Automatically assign Patient
  useEffect(() => {
    if (role === 'patient' && myPatientRecord) {
      setSelectedPatient(myPatientRecord);
    } else if (statePatient) {
      setSelectedPatient(statePatient);
    }
  }, [role, myPatientRecord, statePatient]);

  // Queries for Wizard data
  const { data: patients, isLoading: isPatientsLoading } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientsService.getAll({ search: patientSearch, pageSize: 10 }),
    enabled: isMedicalStaff && step === 1,
  });

  const { data: specialties } = useQuery({
    queryKey: ['specialties-active'],
    queryFn: async () => {
      const { data } = await supabase.from('specialties').select('*').eq('is_active', true).order('name');
      return data as Specialty[];
    },
  });

  const { data: doctorsList, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ['doctors-by-specialty', selectedSpecialty?.id],
    queryFn: () => doctorsService.getAll({ specialty_id: selectedSpecialty?.id, pageSize: 50 }),
    enabled: !!selectedSpecialty,
  });

  const { data: availableSlots, isLoading: isSlotsLoading, refetch: refetchSlots } = useQuery({
    queryKey: ['available-slots', selectedDoctor?.id, selectedDate],
    queryFn: () => doctorsService.getAvailableSlots(selectedDoctor!.id, selectedDate),
    enabled: !!selectedDoctor && !!selectedDate,
  });

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      refetchSlots();
      setSelectedSlot('');
    }
  }, [selectedDate, selectedDoctor]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient || !selectedDoctor || !selectedDate || !selectedSlot) {
        throw new Error('Información incompleta');
      }

      const scheduledDatetime = `${selectedDate}T${selectedSlot}:00`;

      return appointmentsService.create({
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        specialty_id: selectedSpecialty?.id || undefined,
        scheduled_at: scheduledDatetime,
        duration_min: 30, // Default slot duration is 30m
        status: 'pending',
        type: appointmentType,
        reason: reason || undefined,
        notes: notes || undefined,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita reservada con éxito');
      navigate('/appointments');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Error al reservar la cita. Por favor selecciona otra fecha u hora.');
    },
  });

  const handleConfirmAppointment = () => {
    createMutation.mutate();
  };

  const nextStep = () => {
    if (step === 1 && !selectedPatient) {
      toast.error('Por favor selecciona un paciente');
      return;
    }
    if (step === 2 && (!selectedSpecialty || !selectedDoctor)) {
      toast.error('Por favor selecciona especialidad y médico');
      return;
    }
    if (step === 3 && (!selectedDate || !selectedSlot)) {
      toast.error('Por favor selecciona fecha y hora de la cita');
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reservar Nueva Cita</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completa el formulario interactivo paso a paso</p>
        </div>
      </div>

      {/* Steps Indicator Progress Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
        {isMedicalStaff && !statePatientId && (
          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-primary-600 text-white' : step > 1 ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
              {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </span>
            <span className={`text-xs font-semibold ${step === 1 ? 'text-primary-600' : 'text-gray-400'}`}>Paciente</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-primary-600 text-white' : step > 2 ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
            {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
          </span>
          <span className={`text-xs font-semibold ${step === 2 ? 'text-primary-600' : 'text-gray-400'}`}>Médico y Especialidad</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-primary-600 text-white' : step > 3 ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
            {step > 3 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
          </span>
          <span className={`text-xs font-semibold ${step === 3 ? 'text-primary-600' : 'text-gray-400'}`}>Fecha y Slot</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-700'}`}>
            4
          </span>
          <span className={`text-xs font-semibold ${step === 4 ? 'text-primary-600' : 'text-gray-400'}`}>Confirmación</span>
        </div>
      </div>

      {/* Main Wizard Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns - Step Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Select Patient */}
          {step === 1 && isMedicalStaff && (
            <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
              <CardBody className="p-6 space-y-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" /> 1. Selecciona el Paciente
                </h3>
                
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                  <input
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Buscar paciente por nombre, documento o correo..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>

                {/* Patient list search results */}
                {isPatientsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-14 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (patients?.data ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No se encontraron pacientes activos. Intenta otra búsqueda.</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {(patients?.data ?? []).map(p => {
                      const isSelected = selectedPatient?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPatient(p)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10' : 'border-gray-150 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/40'}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar name={`${p.first_name} ${p.last_name}`} src={p.avatar_url} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.first_name} {p.last_name}</p>
                              <p className="text-xs text-gray-400">{p.document_type}: {p.document_number} • {p.email || 'Sin correo'}</p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* STEP 2: Select Specialty & Doctor */}
          {step === 2 && (
            <div className="space-y-6">
              
              {/* Specialty Selection */}
              <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
                <CardBody className="p-6 space-y-4">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-primary-500" /> Selecciona la Especialidad Médica
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {specialties?.map(s => {
                      const isSelected = selectedSpecialty?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedSpecialty(s);
                            setSelectedDoctor(null);
                          }}
                          style={{
                            borderColor: isSelected ? s.color || '#16a34a' : undefined,
                            backgroundColor: isSelected ? `${s.color}15` : undefined
                          }}
                          className={`p-3.5 rounded-xl border border-gray-150 dark:border-gray-700 flex flex-col justify-between h-24 cursor-pointer hover:shadow-sm transition-all`}
                        >
                          <span
                            style={{ color: s.color || '#16a34a' }}
                            className="text-xs font-bold uppercase tracking-wider"
                          >
                            {s.name}
                          </span>
                          <span className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                            {s.description || 'Consulta especializada'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>

              {/* Doctor Selection */}
              {selectedSpecialty && (
                <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
                  <CardBody className="p-6 space-y-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Profesionales en {selectedSpecialty.name}
                    </h3>
                    
                    {isDoctorsLoading ? (
                      <div className="space-y-3">
                        <div className="h-16 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />
                      </div>
                    ) : (doctorsList?.data ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400 py-4">No hay médicos registrados o disponibles para esta especialidad.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {(doctorsList?.data ?? []).map(doctor => {
                          const isSelected = selectedDoctor?.id === doctor.id;
                          return (
                            <div
                              key={doctor.id}
                              onClick={() => setSelectedDoctor(doctor)}
                              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? 'border-primary-500 bg-primary-50/20 dark:bg-primary-950/10' : 'border-gray-150 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/40'}`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar name={doctor.profile?.full_name ?? 'Médico'} src={doctor.profile?.avatar_url} size="md" />
                                <div>
                                  <h4 className="text-sm font-bold text-gray-850 dark:text-white">Dr. {doctor.profile?.full_name}</h4>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Licencia: {doctor.license_number} • Exp: {doctor.experience_years} años
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="success">Consulta: {formatCurrency(doctor.consultation_fee)}</Badge>
                                    {doctor.rating > 0 && <span className="text-[10px] text-amber-500 font-semibold">★ {doctor.rating}</span>}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-primary-500 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
          )}

          {/* STEP 3: Date & Hour Slots */}
          {step === 3 && selectedDoctor && (
            <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
              <CardBody className="p-6 space-y-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" /> 3. Agenda el Día y Horario
                </h3>

                {/* Appointment Modality / Type Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Modalidad de Consulta</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setAppointmentType('presencial')}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center gap-1.5 transition-all ${appointmentType === 'presencial' ? 'border-primary-500 bg-primary-50/15 dark:bg-primary-950/10' : 'border-gray-150 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'}`}
                    >
                      <User className={`w-6 h-6 ${appointmentType === 'presencial' ? 'text-primary-600' : 'text-gray-400'}`} />
                      <p className="text-sm font-bold text-gray-800 dark:text-white">Presencial</p>
                      <p className="text-[10px] text-gray-400 text-center">Atención directa en consultorio clínico</p>
                    </div>
                    <div
                      onClick={() => setAppointmentType('videollamada')}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col items-center gap-1.5 transition-all ${appointmentType === 'videollamada' ? 'border-primary-500 bg-primary-50/15 dark:bg-primary-950/10' : 'border-gray-150 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'}`}
                    >
                      <Video className={`w-6 h-6 ${appointmentType === 'videollamada' ? 'text-primary-600' : 'text-gray-400'}`} />
                      <p className="text-sm font-bold text-gray-800 dark:text-white">Videollamada</p>
                      <p className="text-[10px] text-gray-400 text-center">Telemedicina desde el portal web</p>
                    </div>
                  </div>
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase">Selecciona el Día</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-750 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Available slots */}
                {selectedDate && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Horarios Disponibles
                    </label>
                    {isSlotsLoading ? (
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : !availableSlots || availableSlots.length === 0 ? (
                      <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl">
                        No hay turnos disponibles para el médico en este día. Intenta seleccionar otra fecha u otro médico.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {availableSlots.map(slot => {
                          const isSelected = selectedSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 text-xs font-bold rounded-lg border transition-all ${isSelected ? 'bg-primary-600 text-white border-transparent' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </CardBody>
            </Card>
          )}

          {/* STEP 4: Reason & Final Confirmation */}
          {step === 4 && (
            <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
              <CardBody className="p-6 space-y-4">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary-500" /> 4. Detalle y Confirmación Final
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Motivo de la Cita</label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-750 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Describe brevemente tus síntomas o el motivo del chequeo médico..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase">Notas Adicionales (Opcional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-750 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Alguna observación adicional para la recepción o el médico..."
                    />
                  </div>
                </div>

              </CardBody>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1 || (step === 2 && isMedicalStaff && !statePatientId ? false : step === 2)}
              onClick={prevStep}
            >
              Atrás
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={nextStep}>
                Continuar
              </Button>
            ) : (
              <Button
                type="button"
                loading={createMutation.isPending}
                onClick={handleConfirmAppointment}
              >
                Confirmar Reserva
              </Button>
            )}
          </div>

        </div>

        {/* Right 1 Column - Sticky Summary Card */}
        <div className="space-y-6">
          <Card className="border border-gray-100 dark:border-gray-700 shadow-sm sticky top-6">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/40">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Resumen de la Cita</h3>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              
              {/* Patient Detail Summary */}
              <div className="space-y-1.5 pb-3 border-b border-gray-50 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Paciente</p>
                {selectedPatient ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={`${selectedPatient.first_name} ${selectedPatient.last_name}`} size="xs" />
                    <span className="text-xs font-bold text-gray-800 dark:text-white">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No seleccionado</span>
                )}
              </div>

              {/* Specialty & Doctor Summary */}
              <div className="space-y-1.5 pb-3 border-b border-gray-50 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Especialidad y Médico</p>
                {selectedSpecialty || selectedDoctor ? (
                  <div className="space-y-1">
                    {selectedSpecialty && <Badge variant="info" className="text-[9px]">{selectedSpecialty.name}</Badge>}
                    {selectedDoctor && (
                      <p className="text-xs font-bold text-gray-850 dark:text-white mt-1">
                        Dr. {selectedDoctor.profile?.full_name}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No seleccionado</span>
                )}
              </div>

              {/* Date & Time Summary */}
              <div className="space-y-1.5 pb-3 border-b border-gray-50 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Fecha y Hora</p>
                {selectedDate || selectedSlot ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="purple" className="text-[10px]">
                      {selectedDate ? formatDate(selectedDate) : ''} {selectedSlot ? `a las ${selectedSlot}` : ''}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">No agendado</span>
                )}
              </div>

              {/* Modality Summary */}
              <div className="space-y-1.5 pb-3 border-b border-gray-50 dark:border-gray-700">
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Modalidad</p>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-white">
                  {appointmentType === 'videollamada' ? (
                    <>
                      <Video className="w-4 h-4 text-primary-500" /> Telemedicina (Virtual)
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-primary-500" /> Presencial (Consultorio)
                    </>
                  )}
                </div>
              </div>

              {/* Financial Cost details */}
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3.5 border border-gray-100 dark:border-gray-850 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Tarifa</p>
                  <p className="text-xs text-gray-400 mt-0.5">Pago en consultorio / portal</p>
                </div>
                <p className="text-base font-extrabold text-primary-600">
                  {selectedDoctor ? formatCurrency(selectedDoctor.consultation_fee) : '$0.00'}
                </p>
              </div>

            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
}
