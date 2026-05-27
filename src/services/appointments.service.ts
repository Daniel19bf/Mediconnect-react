import { supabase } from '../lib/supabase';
import type { Appointment, PaginatedResponse, AppointmentStatus } from '../types';

export const appointmentsService = {
  async getAll(opts: { page?: number; pageSize?: number; status?: AppointmentStatus; doctor_id?: string; patient_id?: string; from?: string; to?: string } = {}): Promise<PaginatedResponse<Appointment>> {
    const { page = 1, pageSize = 20, status, doctor_id, patient_id, from, to } = opts;
    let query = supabase
      .from('appointments')
      .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*)), specialty:specialties(*)', { count: 'exact' });

    if (status)     query = query.eq('status', status);
    if (doctor_id)  query = query.eq('doctor_id', doctor_id);
    if (patient_id) query = query.eq('patient_id', patient_id);
    if (from)       query = query.gte('scheduled_at', from);
    if (to)         query = query.lte('scheduled_at', to);

    const { data, error, count } = await query
      .order('scheduled_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    return { data: data as Appointment[], count: count ?? 0, page, pageSize };
  },

  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*), specialty:specialties(*)), specialty:specialties(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Appointment;
  },

  async create(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient' | 'doctor' | 'specialty' | 'reminder_sent'>): Promise<Appointment> {
    const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
    if (error) throw error;
    return data as Appointment;
  },

  async updateStatus(id: string, status: AppointmentStatus, reason?: string): Promise<Appointment> {
    const update: Partial<Appointment> = { status };
    if (reason) update.cancellation_reason = reason;
    const { data, error } = await supabase.from('appointments').update(update).eq('id', id).select().single();
    if (error) throw error;
    return data as Appointment;
  },

  async reschedule(id: string, newDatetime: string): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ scheduled_at: newDatetime, status: 'confirmed' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Appointment;
  },

  async getUpcoming(limit = 5): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), doctor:doctors(*, profile:profiles(*))')
      .gte('scheduled_at', new Date().toISOString())
      .in('status', ['pending','confirmed'])
      .order('scheduled_at')
      .limit(limit);
    if (error) throw error;
    return data as Appointment[];
  },

  subscribeToChanges(callback: (payload: unknown) => void) {
    return supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, callback)
      .subscribe();
  },
};
