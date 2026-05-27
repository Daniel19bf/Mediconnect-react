import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  Heart,
  Plus,
  FileText,
  Upload,
  Download,
  Calendar,
  User,
  Shield,
  Edit2,
  Trash2,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  FileIcon
} from 'lucide-react';
import { patientsService } from '../../services/patients.service';
import { medicalService } from '../../services/medical.service';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { formatDate, formatDateTime, formatCurrency } from '../../lib/utils';
import type { MedicalRecord, Consultation, MedicalFile, FileCategory } from '../../types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface HistoryFormData {
  personal_history: string;
  family_history: string;
  surgical_history: string;
  pharmacological_history: string;
  allergic_history: string;
  weight_kg: number;
  height_cm: number;
  blood_pressure: string;
  heart_rate: number;
  temperature: number;
  oxygen_sat: number;
}

export default function MedicalHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const isMedicalStaff = role === 'admin' || role === 'doctor';

  const [activeTab, setActiveTab] = useState<'record' | 'consultations' | 'files'>('record');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);

  // File Upload Form
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCategory, setFileCategory] = useState<FileCategory>('exam');
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsService.getById(id!),
    enabled: !!id,
  });

  const { data: record, isLoading: isRecordLoading } = useQuery({
    queryKey: ['medical-record', id],
    queryFn: () => medicalService.getRecord(id!),
    enabled: !!id,
  });

  const { data: files, isLoading: isFilesLoading } = useQuery({
    queryKey: ['medical-files', id],
    queryFn: () => medicalService.getFiles(id!),
    enabled: !!id,
  });

  // Background Edit Form
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HistoryFormData>();

  // Mutations
  const updateRecordMutation = useMutation({
    mutationFn: (data: HistoryFormData) => {
      const parsedData = {
        ...data,
        weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
        height_cm: data.height_cm ? Number(data.height_cm) : undefined,
        heart_rate: data.heart_rate ? Number(data.heart_rate) : undefined,
        temperature: data.temperature ? Number(data.temperature) : undefined,
        oxygen_sat: data.oxygen_sat ? Number(data.oxygen_sat) : undefined,
      };
      return medicalService.createOrUpdateRecord(id!, parsedData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-record', id] });
      toast.success('Historia clínica actualizada');
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Error al actualizar historia clínica');
    }
  });

  const handleOpenEdit = () => {
    if (record) {
      reset({
        personal_history: record.personal_history || '',
        family_history: record.family_history || '',
        surgical_history: record.surgical_history || '',
        pharmacological_history: record.pharmacological_history || '',
        allergic_history: record.allergic_history || '',
        weight_kg: record.weight_kg || 0,
        height_cm: record.height_cm || 0,
        blood_pressure: record.blood_pressure || '',
        heart_rate: record.heart_rate || 0,
        temperature: record.temperature || 0,
        oxygen_sat: record.oxygen_sat || 0,
      });
    } else {
      reset({
        personal_history: '',
        family_history: '',
        surgical_history: '',
        pharmacological_history: '',
        allergic_history: '',
        weight_kg: 0,
        height_cm: 0,
        blood_pressure: '',
        heart_rate: 0,
        temperature: 0,
        oxygen_sat: 0,
      });
    }
    setIsEditModalOpen(true);
  };

  const onEditSubmit = (data: HistoryFormData) => {
    updateRecordMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }
    setIsUploading(true);
    try {
      await medicalService.uploadFile(id!, selectedFile, fileCategory);
      qc.invalidateQueries({ queryKey: ['medical-files', id] });
      toast.success('Archivo subido exitosamente');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al subir el archivo');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleExpandConsultation = (cId: string) => {
    setExpandedConsultationId(expandedConsultationId === cId ? null : cId);
  };

  if (isPatientLoading || isRecordLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl w-32 animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
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

  // Sort consultations chronologically (newest first)
  const consultations = record?.consultations
    ? [...record.consultations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate(`/patients/${patient.id}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al perfil
        </button>
        {isMedicalStaff && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Edit2 className="w-4 h-4" />} onClick={handleOpenEdit}>
              Actualizar Ficha
            </Button>
            <Button size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setIsUploadModalOpen(true)}>
              Subir Examen
            </Button>
          </div>
        )}
      </div>

      {/* Patient Header Summary */}
      <Card className="border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <Avatar name={`${patient.first_name} ${patient.last_name}`} src={patient.avatar_url} size="xl" />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Historia Clínica: {patient.first_name} {patient.last_name}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Documento: <span className="font-semibold text-gray-600 dark:text-gray-300">{patient.document_type} {patient.document_number}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  <Badge variant="purple">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : 'Otro'}</Badge>
                  {patient.blood_type && <Badge variant="danger">Grupo Sanguíneo: {patient.blood_type}</Badge>}
                  <Badge>{patient.age} años</Badge>
                  {patient.eps && <Badge variant="info">EPS: {patient.eps}</Badge>}
                </div>
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full md:w-auto">
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 border border-gray-100 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400 font-medium">Peso</p>
                <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">{record?.weight_kg ? `${record.weight_kg} kg` : '—'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 border border-gray-100 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400 font-medium">Estatura</p>
                <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">{record?.height_cm ? `${record.height_cm} cm` : '—'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 border border-gray-100 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400 font-medium">Presión Art.</p>
                <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">{record?.blood_pressure || '—'}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 px-6 py-2">
          <button
            onClick={() => setActiveTab('record')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors -mb-[2px] ${activeTab === 'record' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            Ficha y Antecedentes
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors -mb-[2px] ${activeTab === 'consultations' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            Consultas Médicas ({consultations.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors -mb-[2px] ${activeTab === 'files' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            Exámenes y Documentos ({files?.length ?? 0})
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* Record / Antecedentes */}
          {activeTab === 'record' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Antecedentes Personales */}
                <div className="space-y-2 bg-gray-50 dark:bg-gray-900/20 p-4.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-primary-500" /> Antecedentes Personales
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line min-h-[60px]">
                    {record?.personal_history || 'No registra antecedentes personales.'}
                  </p>
                </div>

                {/* Antecedentes Familiares */}
                <div className="space-y-2 bg-gray-50 dark:bg-gray-900/20 p-4.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-4.5 h-4.5 text-red-500" /> Antecedentes Familiares
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line min-h-[60px]">
                    {record?.family_history || 'No registra antecedentes familiares.'}
                  </p>
                </div>

                {/* Antecedentes Quirúrgicos */}
                <div className="space-y-2 bg-gray-50 dark:bg-gray-900/20 p-4.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-blue-500" /> Antecedentes Quirúrgicos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line min-h-[60px]">
                    {record?.surgical_history || 'No registra intervenciones quirúrgicas.'}
                  </p>
                </div>

                {/* Antecedentes Alérgicos */}
                <div className="space-y-2 bg-gray-50 dark:bg-gray-900/20 p-4.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4.5 h-4.5 text-amber-500" /> Alergias e Intolerancias
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold whitespace-pre-line min-h-[60px]">
                    {record?.allergic_history || 'No registra alergias conocidas.'}
                  </p>
                </div>

                {/* Antecedentes Farmacológicos */}
                <div className="md:col-span-2 space-y-2 bg-gray-50 dark:bg-gray-900/20 p-4.5 rounded-xl border border-gray-100 dark:border-gray-800/60">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-purple-500" /> Medicamentos de Uso Diario / Farmacológicos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line min-h-[60px]">
                    {record?.pharmacological_history || 'No registra medicamentos en uso actual.'}
                  </p>
                </div>

              </div>

              {/* Vital Signs Detail */}
              <div className="border-t border-gray-150 dark:border-gray-700 pt-6">
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-500" /> Signos Vitales y Mediciones Generales (Última Visita)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 bg-white dark:bg-gray-950/20 text-center">
                    <p className="text-xs text-gray-400 font-semibold">Peso</p>
                    <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">{record?.weight_kg ? `${record.weight_kg} kg` : '—'}</p>
                  </div>
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 bg-white dark:bg-gray-950/20 text-center">
                    <p className="text-xs text-gray-400 font-semibold">Estatura</p>
                    <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">{record?.height_cm ? `${record.height_cm} cm` : '—'}</p>
                  </div>
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 bg-white dark:bg-gray-950/20 text-center">
                    <p className="text-xs text-gray-400 font-semibold">Presión Arterial</p>
                    <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">{record?.blood_pressure || '—'}</p>
                  </div>
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 bg-white dark:bg-gray-950/20 text-center">
                    <p className="text-xs text-gray-400 font-semibold">Frec. Cardíaca</p>
                    <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">{record?.heart_rate ? `${record.heart_rate} lpm` : '—'}</p>
                  </div>
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 bg-white dark:bg-gray-950/20 text-center">
                    <p className="text-xs text-gray-400 font-semibold">Temperatura</p>
                    <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">{record?.temperature ? `${record.temperature} °C` : '—'}</p>
                  </div>
                  <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-3.5 bg-white dark:bg-gray-950/20 text-center">
                    <p className="text-xs text-gray-400 font-semibold">Saturación O₂</p>
                    <p className="text-lg font-extrabold text-gray-800 dark:text-white mt-1">{record?.oxygen_sat ? `${record.oxygen_sat} %` : '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consultations Timeline */}
          {activeTab === 'consultations' && (
            <div className="space-y-4">
              {consultations.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-base font-medium">No se registran consultas previas</p>
                  <p className="text-sm mt-1">El historial médico de consultas se poblará cuando los médicos completen citas médicas.</p>
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-750">
                  {consultations.map(consultation => {
                    const isExpanded = expandedConsultationId === consultation.id;
                    const hasPrescriptions = consultation.prescriptions && consultation.prescriptions.length > 0;
                    const hasFiles = consultation.files && consultation.files.length > 0;
                    return (
                      <div key={consultation.id} className="relative pl-12">
                        {/* Timeline Icon */}
                        <div className="absolute left-3 top-4 -translate-x-1/2 w-6 h-6 rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-500 flex items-center justify-center text-primary-500 z-10">
                          <Activity className="w-3 h-3" />
                        </div>

                        {/* Consultation Card */}
                        <Card className="border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                          {/* Card Header Clickable to Toggle */}
                          <div
                            onClick={() => toggleExpandConsultation(consultation.id)}
                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatDate(consultation.created_at)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-400 font-medium">por</span>
                                <Badge variant="info">
                                  Dr. {consultation.doctor?.profile?.full_name || 'Médico'} ({consultation.doctor?.specialty?.name || 'Medicina General'})
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                                Motivo: <span className="font-semibold text-gray-700 dark:text-gray-300 italic">{consultation.chief_complaint}</span>
                              </span>
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </div>
                          </div>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700/50 space-y-5 animate-slide-down">
                              
                              {/* Clinical Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-950/10 p-4 rounded-xl space-y-1">
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivo de Consulta / Síntomas</p>
                                  <p className="text-sm text-gray-800 dark:text-gray-200">{consultation.chief_complaint}</p>
                                  {consultation.symptoms && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-850">
                                      <p className="text-xs font-semibold text-gray-400">Síntomas Reportados:</p>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{consultation.symptoms}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-950/10 p-4 rounded-xl space-y-1">
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Examen Físico</p>
                                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                                    {consultation.physical_exam || 'Sin examen físico reportado.'}
                                  </p>
                                </div>
                              </div>

                              {/* Vital signs registered during the consultation */}
                              {consultation.vital_signs && Object.keys(consultation.vital_signs).length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Signos Vitales Tomados en la Consulta</p>
                                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {Object.entries(consultation.vital_signs).map(([key, val]) => (
                                      <div key={key} className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800/80 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-gray-400 font-semibold uppercase">{key.replace('_', ' ')}</p>
                                        <p className="text-sm font-bold text-gray-700 dark:text-white mt-0.5">{String(val)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Diagnosis & Treatment */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50/20 dark:bg-green-950/5 border border-green-100/50 dark:border-green-900/20 p-4 rounded-xl space-y-1.5">
                                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Diagnóstico Principal</p>
                                  <p className="text-sm font-bold text-gray-800 dark:text-white">{consultation.diagnosis}</p>
                                  {consultation.diagnosis_codes && consultation.diagnosis_codes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {consultation.diagnosis_codes.map(c => <Badge key={c} variant="purple">{c}</Badge>)}
                                    </div>
                                  )}
                                </div>
                                <div className="bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100/50 dark:border-blue-900/20 p-4 rounded-xl space-y-1">
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Tratamiento / Plan Terapéutico</p>
                                  <p className="text-sm text-gray-800 dark:text-white whitespace-pre-line">{consultation.treatment}</p>
                                </div>
                              </div>

                              {/* Recipes / Prescriptions */}
                              {hasPrescriptions && (
                                <div className="border border-gray-150 dark:border-gray-700 rounded-xl p-4.5 bg-white dark:bg-gray-900/10 space-y-3">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="w-4.5 h-4.5 text-primary-500" /> Receta Médica Generada
                                  </p>
                                  {consultation.prescriptions?.map(p => (
                                    <div key={p.id} className="space-y-3">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                          <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase">
                                              <th className="py-2">Medicamento</th>
                                              <th className="py-2">Dosis</th>
                                              <th className="py-2">Frecuencia</th>
                                              <th className="py-2">Duración</th>
                                              <th className="py-2">Instrucciones</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/40 text-gray-700 dark:text-gray-300">
                                            {p.medications.map((m, idx) => (
                                              <tr key={idx}>
                                                <td className="py-2 font-semibold text-gray-900 dark:text-white">{m.name}</td>
                                                <td className="py-2">{m.dose}</td>
                                                <td className="py-2">{m.frequency}</td>
                                                <td className="py-2">{m.duration}</td>
                                                <td className="py-2 italic text-gray-400">{m.instructions || 'Ninguna'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      {p.indications && (
                                        <div className="pt-2 text-xs text-gray-500 border-t border-gray-50 dark:border-gray-850">
                                          <span className="font-semibold text-gray-700 dark:text-gray-400">Indicaciones Generales:</span> {p.indications}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Consultation Files */}
                              {hasFiles && (
                                <div className="space-y-2">
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Archivos de la Consulta</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {consultation.files?.map(f => (
                                      <a
                                        key={f.id}
                                        href={f.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <FileIcon className="w-5 h-5 text-primary-500 shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-800 dark:text-white truncate max-w-[200px]">{f.name}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{f.category}</p>
                                          </div>
                                        </div>
                                        <Download className="w-4 h-4 text-gray-400 shrink-0 hover:text-primary-500 transition-colors" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Observations */}
                              {consultation.observations && (
                                <div className="bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/30 dark:border-amber-900/10 p-3.5 rounded-xl">
                                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Observaciones Médicas / Seguimiento</p>
                                  <p className="text-xs text-amber-900 dark:text-amber-300 mt-1 italic">{consultation.observations}</p>
                                </div>
                              )}

                            </div>
                          )}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Patient Files and Laboratory Exams */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 dark:border-gray-700 pb-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Repositorio de Documentos</h3>
                  <p className="text-xs text-gray-400">Exámenes, Laboratorios, Radiografías e Historias Clínicas cargadas</p>
                </div>
                {isMedicalStaff && (
                  <Button size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setIsUploadModalOpen(true)}>
                    Cargar Documento
                  </Button>
                )}
              </div>

              {isFilesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !files || files.length === 0 ? (
                <div className="py-16 text-center text-gray-400">
                  <FileIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 animate-pulse" />
                  <p className="text-base font-medium">No se registran documentos en el sistema</p>
                  <p className="text-sm mt-1">Los exámenes cargados por médicos aparecerán listados aquí.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {files.map(file => (
                    <Card key={file.id} className="border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                      <CardBody className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900 flex items-center justify-center text-primary-500 shrink-0">
                            <FileIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white truncate max-w-[200px] sm:max-w-[280px]" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={file.category === 'exam' ? 'info' : file.category === 'lab' ? 'purple' : 'default'} className="px-1.5 py-0.5 text-[9px] uppercase">
                                {file.category}
                              </Badge>
                              <span className="text-[10px] text-gray-400">{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Background / Ficha Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Actualizar Ficha Médica y Antecedentes"
        size="2xl"
      >
        <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Ficha */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Antecedentes Personales</label>
              <textarea
                {...register('personal_history')}
                rows={3}
                className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Patologías previas, vacunas, etc..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Antecedentes Familiares</label>
              <textarea
                {...register('family_history')}
                rows={3}
                className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Hipertensión, cáncer en línea directa, etc..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Antecedentes Quirúrgicos</label>
              <textarea
                {...register('surgical_history')}
                rows={3}
                className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Operaciones previas, prótesis, etc..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Alergias e Intolerancias</label>
              <textarea
                {...register('allergic_history')}
                rows={3}
                className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Alergias a medicamentos, picaduras, alimentos..."
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400 uppercase">Antecedentes Farmacológicos</label>
              <textarea
                {...register('pharmacological_history')}
                rows={3}
                className="w-full text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Medicamentos en uso actual y diario..."
              />
            </div>

          </div>

          {/* General measurements / Vital signs in modal */}
          <div className="border-t border-gray-150 dark:border-gray-700 pt-4 space-y-4">
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary-500" /> Mediciones Generales y Signos Vitales
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <Input label="Peso (kg)" type="number" step="0.1" {...register('weight_kg')} />
              <Input label="Estatura (cm)" type="number" {...register('height_cm')} />
              <Input label="Presión Art." placeholder="120/80" {...register('blood_pressure')} />
              <Input label="Frec. Cardíaca (lpm)" type="number" {...register('heart_rate')} />
              <Input label="Temperatura (°C)" type="number" step="0.1" {...register('temperature')} />
              <Input label="Sat. Oxígeno (%)" type="number" {...register('oxygen_sat')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-150 dark:border-gray-700 pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={updateRecordMutation.isPending}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* File Upload Modal */}
      <Modal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Subir Examen Médico o Laboratorio"
      >
        <form onSubmit={handleUploadFile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría de Documento</label>
            <select
              value={fileCategory}
              onChange={e => setFileCategory(e.target.value as FileCategory)}
              className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="exam">Examen General</option>
              <option value="lab">Laboratorio Clínico</option>
              <option value="image">Imagen Médica / Radiografía</option>
              <option value="prescription">Receta / Fórmula Médica</option>
              <option value="other">Otro Documento</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar Archivo</label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-750 hover:border-primary-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              />
              <Upload className="w-8 h-8 text-gray-300 mb-2" />
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-semibold text-primary-500 max-w-[240px] truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Haz clic o arrastra un archivo aquí</p>
                  <p className="text-xs text-gray-400 mt-1">Soporta PDF, PNG, JPG de hasta 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-750">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={isUploading}>
              Subir Archivo
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
