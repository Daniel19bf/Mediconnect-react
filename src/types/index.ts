// ============================================================
// MediConnect – Tipos globales TypeScript
// ============================================================

export type UserRole = 'admin' | 'doctor' | 'patient';
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type Gender = 'male' | 'female' | 'other';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type FileCategory = 'exam' | 'lab' | 'image' | 'prescription' | 'other';
export type CallStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type NotifType = 'appointment' | 'message' | 'result' | 'system' | 'alert';

// ── Profile ────────────────────────────────────────────────
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Specialty ──────────────────────────────────────────────
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

// ── Doctor ─────────────────────────────────────────────────
export interface Doctor {
  id: string;
  profile_id: string;
  specialty_id?: string;
  license_number: string;
  experience_years: number;
  bio?: string;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  profile?: Profile;
  specialty?: Specialty;
  schedules?: DoctorSchedule[];
}

export interface DoctorSchedule {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration: number;
  max_patients: number;
  is_active: boolean;
}

// ── Patient ────────────────────────────────────────────────
export interface Patient {
  id: string;
  profile_id?: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  birth_date: string;
  age?: number; // calculado
  gender: Gender;
  blood_type?: BloodType;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  eps?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  avatar_url?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Appointment ────────────────────────────────────────────
export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  specialty_id?: string;
  scheduled_at: string;
  duration_min: number;
  status: AppointmentStatus;
  type: 'presencial' | 'videollamada';
  reason?: string;
  notes?: string;
  cancellation_reason?: string;
  reminder_sent: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joins
  patient?: Patient;
  doctor?: Doctor;
  specialty?: Specialty;
}

// ── Medical Record ─────────────────────────────────────────
export interface MedicalRecord {
  id: string;
  patient_id: string;
  created_by?: string;
  personal_history?: string;
  family_history?: string;
  surgical_history?: string;
  pharmacological_history?: string;
  allergic_history?: string;
  weight_kg?: number;
  height_cm?: number;
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  oxygen_sat?: number;
  created_at: string;
  updated_at: string;
  consultations?: Consultation[];
}

// ── Consultation ───────────────────────────────────────────
export interface Consultation {
  id: string;
  appointment_id?: string;
  medical_record_id?: string;
  patient_id: string;
  doctor_id: string;
  chief_complaint: string;
  symptoms?: string;
  physical_exam?: string;
  vital_signs?: Record<string, string | number>;
  diagnosis?: string;
  diagnosis_codes?: string[];
  treatment?: string;
  observations?: string;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  // Joins
  doctor?: Doctor;
  prescriptions?: Prescription[];
  files?: MedicalFile[];
}

// ── Prescription ───────────────────────────────────────────
export interface Medication {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  consultation_id?: string;
  patient_id: string;
  doctor_id: string;
  medications: Medication[];
  indications?: string;
  signature_url?: string;
  pdf_url?: string;
  issued_at: string;
  valid_until?: string;
  created_at: string;
  // Joins
  doctor?: Doctor;
  patient?: Patient;
}

// ── Medical File ───────────────────────────────────────────
export interface MedicalFile {
  id: string;
  patient_id: string;
  consultation_id?: string;
  uploaded_by?: string;
  category: FileCategory;
  name: string;
  description?: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
}

// ── Video Call ─────────────────────────────────────────────
export interface VideoCall {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  room_name: string;
  status: CallStatus;
  started_at?: string;
  ended_at?: string;
  recording_url?: string;
  notes?: string;
  created_at: string;
}

// ── Message ────────────────────────────────────────────────
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content?: string;
  file_url?: string;
  file_name?: string;
  mime_type?: string;
  status: MessageStatus;
  read_at?: string;
  created_at: string;
  // Joins
  sender?: Profile;
}

// ── Notification ───────────────────────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── Audit Log ──────────────────────────────────────────────
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profile?: Profile;
}

// ── Dashboard Stats ────────────────────────────────────────
export interface DashboardStats {
  total_patients: number;
  active_doctors: number;
  scheduled_appointments: number;
  completed_consultations: number;
  video_calls_done: number;
  monthly_revenue: number;
  appointments_by_specialty: { specialty: string; count: number }[];
  patients_by_month: { month: string; count: number }[];
  appointments_trend: { date: string; count: number }[];
}

// ── API Response ───────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
