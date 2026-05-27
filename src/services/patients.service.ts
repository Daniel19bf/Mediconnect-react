import { supabase } from '../lib/supabase';
import type { Patient, PaginatedResponse } from '../types';
import { calcAge } from '../lib/utils';

export const patientsService = {
  async getAll(opts: { page?: number; pageSize?: number; search?: string; } = {}): Promise<PaginatedResponse<Patient>> {
    const { page = 1, pageSize = 20, search } = opts;
    let query = supabase.from('patients').select('*', { count: 'exact' });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,document_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    const patients = (data as Patient[]).map(p => ({ ...p, age: calcAge(p.birth_date) }));
    return { data: patients, count: count ?? 0, page, pageSize };
  },

  async getById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    const p = data as Patient;
    return { ...p, age: calcAge(p.birth_date) };
  },

  async create(patient: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'age'>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert(patient)
      .select()
      .single();
    if (error) throw error;
    return data as Patient;
  },

  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Patient;
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await supabase.from('patients').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  async uploadAvatar(patientId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `patients/${patientId}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  },

  async getStats() {
    const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true);
    return { total: count ?? 0 };
  },
};
