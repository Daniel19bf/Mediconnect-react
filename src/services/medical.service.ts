import { supabase } from '../lib/supabase';
import type { MedicalRecord, Consultation, Prescription, MedicalFile } from '../types';

export const medicalService = {
  // ── Medical Record ─────────────────────────────────────────
  async getRecord(patientId: string): Promise<MedicalRecord | null> {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*, consultations(*, doctor:doctors(*, profile:profiles(*)), prescriptions(*), files:medical_files(*))')
      .eq('patient_id', patientId)
      .single();
    if (error) return null;
    return data as MedicalRecord;
  },

  async createOrUpdateRecord(patientId: string, updates: Partial<MedicalRecord>): Promise<MedicalRecord> {
    const existing = await this.getRecord(patientId);
    if (existing) {
      const { data, error } = await supabase.from('medical_records').update(updates).eq('id', existing.id).select().single();
      if (error) throw error;
      return data as MedicalRecord;
    }
    const { data, error } = await supabase.from('medical_records').insert({ patient_id: patientId, ...updates }).select().single();
    if (error) throw error;
    return data as MedicalRecord;
  },

  // ── Consultations ──────────────────────────────────────────
  async getConsultations(patientId: string): Promise<Consultation[]> {
    const { data, error } = await supabase
      .from('consultations')
      .select('*, doctor:doctors(*, profile:profiles(*)), prescriptions(*), files:medical_files(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Consultation[];
  },

  async createConsultation(consultation: Omit<Consultation, 'id' | 'created_at' | 'updated_at' | 'doctor' | 'prescriptions' | 'files'>): Promise<Consultation> {
    const { data, error } = await supabase.from('consultations').insert(consultation).select().single();
    if (error) throw error;
    return data as Consultation;
  },

  // ── Prescriptions ──────────────────────────────────────────
  async createPrescription(prescription: Omit<Prescription, 'id' | 'created_at' | 'issued_at' | 'doctor' | 'patient'>): Promise<Prescription> {
    const { data, error } = await supabase.from('prescriptions').insert(prescription).select().single();
    if (error) throw error;
    return data as Prescription;
  },

  async getPatientPrescriptions(patientId: string): Promise<Prescription[]> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, doctor:doctors(*, profile:profiles(*))')
      .eq('patient_id', patientId)
      .order('issued_at', { ascending: false });
    if (error) throw error;
    return data as Prescription[];
  },

  // ── Files ──────────────────────────────────────────────────
  async uploadFile(patientId: string, file: File, category: string, consultationId?: string): Promise<MedicalFile> {
    const path = `medical/${patientId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('medical-files').upload(path, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('medical-files').getPublicUrl(path);

    const { data, error } = await supabase.from('medical_files').insert({
      patient_id: patientId,
      consultation_id: consultationId,
      category,
      name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
    }).select().single();
    if (error) throw error;
    return data as MedicalFile;
  },

  async getFiles(patientId: string): Promise<MedicalFile[]> {
    const { data, error } = await supabase
      .from('medical_files')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as MedicalFile[];
  },
};
