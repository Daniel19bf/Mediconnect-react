import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  ArrowLeft,
  FileText,
  Activity,
  Heart,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Upload,
  User,
  Shield,
  BadgeAlert,
  ClipboardList,
  Video
} from 'lucide-react';
import { appointmentsService } from '../../services/appointments.service';
import { medicalService } from '../../services/medical.service';
import { patientsService } from '../../services/patients.service';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import type { Medication, Consultation } from '../../types';
import toast from 'react-hot-toast';

interface ConsultationFormData {
  chief_complaint: string;
  symptoms: string;
  physical_exam: string;
  weight_kg: string;
  height_cm: string;
  blood_pressure: string;
  heart_rate: string;
  temperature: string;
  oxygen_sat: string;
  diagnosis: string;
  diagnosis_codes: string; // Comma separated codes
  treatment: string;
  observations: string;
  follow_up_date: string;
  medications: Medication[];
  indications: string;
  valid_until: string;
}

export default function ConsultationPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [diagnosticsTags, setDiagnosticsTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  // Queries
  const { data: appointment, isLoading: isApptLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsService.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<ConsultationFormData>({
    defaultValues: {
      medications: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications',
  });

  const addMedication = () => {
    append({ name: '', dose: '', frequency: '', duration: '', instructions: '' });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = currentTag.trim().toUpperCase();
      if (tag && !diagnosticsTags.includes(tag)) {
        setDiagnosticsTags([...diagnosticsTags, tag]);
        setCurrentTag('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDiagnosticsTags(diagnosticsTags.filter(t => t !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, idx) => idx !== index));
  };

  const onSubmit = async (data: ConsultationFormData) => {
    if (!appointment) return;
    setIsSubmittingAll(true);
    try {
      // 1. Fetch or create medical record for the patient
      const medicalRecord = await medicalService.createOrUpdateRecord(appointment.patient_id, {
        personal_history: 'Actualizado en consulta.',
        weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
        height_cm: data.height_cm ? Number(data.height_cm) : undefined,
        blood_pressure: data.blood_pressure || undefined,
        heart_rate: data.heart_rate ? Number(data.heart_rate) : undefined,
        temperature: data.temperature ? Number(data.temperature) : undefined,
        oxygen_sat: data.oxygen_sat ? Number(data.oxygen_sat) : undefined,
      });

      // 2. Prepare vital signs JSON
      const vitalsJSON = {
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        blood_pressure: data.blood_pressure,
        heart_rate: data.heart_rate,
        temperature: data.temperature,
        oxygen_sat: data.oxygen_sat,
      };

      // 3. Create Consultation
      const consultation = await medicalService.createConsultation({
        appointment_id: appointmentId,
        medical_record_id: medicalRecord.id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        chief_complaint: data.chief_complaint,
        symptoms: data.symptoms || undefined,
        physical_exam: data.physical_exam || undefined,
        vital_signs: vitalsJSON,
        diagnosis: data.diagnosis,
        diagnosis_codes: diagnosticsTags,
        treatment: data.treatment,
        observations: data.observations || undefined,
        follow_up_date: data.follow_up_date || undefined,
      });

      // 4. Create Prescription if medications exist
      if (data.medications && data.medications.length > 0) {
        // filter out empty medication names
        const validMeds = data.medications.filter(m => m.name.trim() !== '');
        if (validMeds.length > 0) {
          await medicalService.createPrescription({
            consultation_id: consultation.id,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            medications: validMeds,
            indications: data.indications || undefined,
            valid_until: data.valid_until || undefined,
          });
        }
      }

      // 5. Upload files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await medicalService.uploadFile(appointment.patient_id, file, 'exam', consultation.id);
        }
      }

      // 6. Complete appointment status
      await appointmentsService.updateStatus(appointmentId!, 'completed');

      toast.success('Consulta médica completada con éxito');
      navigate('/appointments');
    } catch (err: any) {
      console.error(err);
      toast.error('Ocurrió un error al guardar la consulta');
    } finally {
      setIsSubmittingAll(false);
    }
  };

  if (isApptLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl w-32 animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="py-16 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-base font-medium">Cita no encontrada o inválida</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/appointments')}>
          Volver a citas
        </Button>
      </div>
    );
  }

  const { patient } = appointment;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Patient summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a citas
        </button>
        <Badge variant="purple">Consulta en Proceso</Badge>
      </div>

      {/* Patient Header Card */}
      {patient && (
        <Card className="border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <CardBody className="p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Avatar name={`${patient.first_name} ${patient.last_name}`} src={patient.avatar_url} size="lg" />
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {patient.first_name} {patient.last_name}
                </h1>
                <p className="text-xs text-gray-450 dark:text-gray-400 mt-0.5">
                  Documento: {patient.document_type} {patient.document_number} • Edad: {patientsService.getById ? `${patient.age || '—'} años` : ''}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                  <Badge variant="info">EPS: {patient.eps || 'No registra'}</Badge>
                  {patient.blood_type && <Badge variant="danger">Grupo Sanguíneo: {patient.blood_type}</Badge>}
                  {appointment.reason && (
                    <span className="text-xs text-gray-500 italic ml-2">Motivo Cita: "{appointment.reason}"</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-2.5 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Cita Modalidad</p>
              <p className="text-sm font-extrabold text-gray-800 dark:text-white flex items-center gap-1.5 mt-0.5 capitalize justify-center">
                {appointment.type === 'videollamada' ? <Video className="w-4 h-4 text-primary-500" /> : <User className="w-4 h-4 text-primary-500" />}
                {appointment.type}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Main Consultation Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns - Clinical details form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/40">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4.5 h-4.5 text-primary-500" /> Registro Clínico de Consulta
              </h3>
            </CardHeader>
            <CardBody className="p-6 space-y-5">
              
              {/* Motivo & Síntomas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Motivo de Consulta <span className="text-red-500">*</span></label>
                  <textarea
                    {...register('chief_complaint', { required: 'Motivo de consulta es requerido' })}
                    rows={3}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Escribe el motivo principal de la consulta médica..."
                  />
                  {errors.chief_complaint && <p className="text-xs text-red-500 mt-0.5">{errors.chief_complaint.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Síntomas Subjetivos</label>
                  <textarea
                    {...register('symptoms')}
                    rows={3}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder="Detalles sobre dolor, duración de síntomas, etc..."
                  />
                </div>
              </div>

              {/* Physical Exam */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase">Examen Físico</label>
                <textarea
                  {...register('physical_exam')}
                  rows={3}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Descripción del examen físico (cabeza, cuello, abdomen, extremidades)..."
                />
              </div>

              {/* Vital Signs inputs */}
              <div className="border-t border-gray-150 dark:border-gray-700 pt-5 space-y-3.5">
                <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-primary-500" /> Signos Vitales y Mediciones
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <Input label="Peso (kg)" type="number" step="0.1" {...register('weight_kg')} />
                  <Input label="Estatura (cm)" type="number" {...register('height_cm')} />
                  <Input label="Presión Arterial" placeholder="120/80" {...register('blood_pressure')} />
                  <Input label="FC (lpm)" type="number" {...register('heart_rate')} />
                  <Input label="Temperatura (°C)" type="number" step="0.1" {...register('temperature')} />
                  <Input label="Saturación O₂ (%)" type="number" {...register('oxygen_sat')} />
                </div>
              </div>

              {/* Diagnosis and codes */}
              <div className="border-t border-gray-150 dark:border-gray-700 pt-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Diagnóstico Principal <span className="text-red-500">*</span></label>
                    <textarea
                      {...register('diagnosis', { required: 'Diagnóstico es requerido' })}
                      rows={2}
                      className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-255 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Diagnóstico clínico principal..."
                    />
                    {errors.diagnosis && <p className="text-xs text-red-500 mt-0.5">{errors.diagnosis.message}</p>}
                  </div>
                  
                  {/* CIE-10 Codes Tag selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 uppercase">Códigos de Diagnóstico (CIE-10)</label>
                    <div className="flex gap-2">
                      <input
                        value={currentTag}
                        onChange={e => setCurrentTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Escribe código (e.g. I10) y presiona Enter"
                        className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-250 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const tag = currentTag.trim().toUpperCase();
                          if (tag && !diagnosticsTags.includes(tag)) {
                            setDiagnosticsTags([...diagnosticsTags, tag]);
                            setCurrentTag('');
                          }
                        }}
                      >
                        Añadir
                      </Button>
                    </div>
                    {/* Tags List */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {diagnosticsTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 dark:bg-primary-950/40 dark:text-primary-400 px-2 py-0.5 rounded-md text-xs font-bold">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 focus:outline-none font-extrabold text-[10px]">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase">Tratamiento / Plan Terapéutico <span className="text-red-500">*</span></label>
                <textarea
                  {...register('treatment', { required: 'Plan de tratamiento es requerido' })}
                  rows={3}
                  className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Detalla las indicaciones, dosis generales, reposo, control, etc..."
                />
                {errors.treatment && <p className="text-xs text-red-500 mt-0.5">{errors.treatment.message}</p>}
              </div>

              {/* Observations & Control */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-150 dark:border-gray-700 pt-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Observaciones Adicionales</label>
                  <textarea
                    {...register('observations')}
                    rows={2}
                    className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-250 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Observaciones de enfermería, seguimiento telefónico..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-400 uppercase">Fecha de Control / Próxima Cita</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('follow_up_date')}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

            </CardBody>
          </Card>
        </div>

        {/* Right 1 Column - Prescription Form, Files Upload and Actions */}
        <div className="space-y-6">
          
          {/* Prescription Formula Card */}
          <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-primary-500" /> Fórmula Médica
              </h3>
              <button
                type="button"
                onClick={addMedication}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 focus:outline-none"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              
              {/* Dynamic Medications List */}
              {fields.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No has agregado ningún medicamento a esta fórmula.</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {fields.map((field, idx) => (
                    <div key={field.id} className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800/80 rounded-xl space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-[10px] font-bold text-primary-600">Medicina #{idx + 1}</p>
                      
                      <div className="space-y-1.5">
                        <input
                          {...register(`medications.${idx}.name` as const, { required: true })}
                          placeholder="Nombre (e.g. Acetaminofén)"
                          className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1.5">
                        <input
                          {...register(`medications.${idx}.dose` as const)}
                          placeholder="Dosis (500mg)"
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                        />
                        <input
                          {...register(`medications.${idx}.frequency` as const)}
                          placeholder="Frec (C/8h)"
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                        />
                        <input
                          {...register(`medications.${idx}.duration` as const)}
                          placeholder="Duración (7d)"
                          className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <input
                        {...register(`medications.${idx}.instructions` as const)}
                        placeholder="Instrucciones adicionales..."
                        className="w-full px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Prescription metadata */}
              {fields.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-gray-150 dark:border-gray-700">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Indicaciones Generales de Fórmula</label>
                    <textarea
                      {...register('indications')}
                      rows={2}
                      className="w-full text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-white focus:outline-none"
                      placeholder="Indicaciones sobre dieta, hidratación, reposo..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Fórmula Válida Hasta</label>
                    <input
                      type="date"
                      {...register('valid_until')}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

            </CardBody>
          </Card>

          {/* Attachment upload */}
          <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
            <CardHeader className="bg-gray-50/50 dark:bg-gray-800/40">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-4.5 h-4.5 text-primary-500" /> Carga de Exámenes Relacionados
              </h3>
            </CardHeader>
            <CardBody className="p-4 space-y-3">
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-750 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors relative hover:border-primary-500">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <Upload className="w-6 h-6 text-gray-300 mb-1" />
                <p className="text-[10px] text-gray-400 text-center">Selecciona o arrastra archivos PDF o imágenes aquí</p>
              </div>

              {/* Uploaded Files Queue */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 pt-2 max-h-[140px] overflow-y-auto pr-1">
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg border border-gray-100 dark:border-gray-800/80">
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-gray-400 hover:text-red-500 focus:outline-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Consultation save and submit card */}
          <Card className="border border-gray-100 dark:border-gray-700 shadow-sm">
            <CardBody className="p-5 space-y-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Completar e Imprimir</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                    Al guardar, la consulta se registrará en la historia clínica del paciente, la cita cambiará a "Completada" y se habilitará la receta médica para el paciente.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-750">
                <Button
                  type="submit"
                  className="w-full justify-center"
                  loading={isSubmittingAll}
                >
                  Finalizar Consulta Médica
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => navigate('/appointments')}
                >
                  Salir sin guardar
                </Button>
              </div>
            </CardBody>
          </Card>

        </div>

      </form>
    </div>
  );
}
