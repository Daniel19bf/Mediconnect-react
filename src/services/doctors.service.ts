import { supabase } from '../lib/supabase';
import type { Doctor, DoctorSchedule, PaginatedResponse } from '../types';

export const doctorsService = {
  async getAll(opts: { page?: number; pageSize?: number; search?: string; specialty_id?: string } = {}): Promise<PaginatedResponse<Doctor>> {
    const { page = 1, pageSize = 20, search, specialty_id } = opts;
    let query = supabase
      .from('doctors')
      .select('*, profile:profiles(*), specialty:specialties(*)', { count: 'exact' });

    if (search) {
      query = query.or(`profile.full_name.ilike.%${search}%,license_number.ilike.%${search}%`);
    }
    if (specialty_id) query = query.eq('specialty_id', specialty_id);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    return { data: data as Doctor[], count: count ?? 0, page, pageSize };
  },

  async getById(id: string): Promise<Doctor | null> {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, profile:profiles(*), specialty:specialties(*), schedules:doctor_schedules(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Doctor;
  },

  async create(doctor: Omit<Doctor, 'id' | 'created_at' | 'updated_at' | 'profile' | 'specialty' | 'schedules' | 'rating' | 'total_reviews'>): Promise<Doctor> {
    const { data, error } = await supabase.from('doctors').insert(doctor).select().single();
    if (error) throw error;
    return data as Doctor;
  },

  async update(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    const { data, error } = await supabase.from('doctors').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Doctor;
  },

  async getSchedules(doctorId: string): Promise<DoctorSchedule[]> {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('is_active', true)
      .order('day_of_week');
    if (error) throw error;
    return data as DoctorSchedule[];
  },

  async upsertSchedule(schedule: Omit<DoctorSchedule, 'id'>): Promise<DoctorSchedule> {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .upsert(schedule, { onConflict: 'doctor_id,day_of_week' })
      .select()
      .single();
    if (error) throw error;
    return data as DoctorSchedule;
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    // Obtener horario del día
    const dayOfWeek = new Date(date).getDay();
    const { data: schedule } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single();

    if (!schedule) return [];

    // Obtener citas existentes ese día
    const startOfDay = `${date}T00:00:00`;
    const endOfDay   = `${date}T23:59:59`;
    const { data: existing } = await supabase
      .from('appointments')
      .select('scheduled_at')
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay)
      .in('status', ['pending','confirmed','in_progress']);

    const bookedTimes = new Set((existing ?? []).map(a => a.scheduled_at.slice(11, 16)));

    // Generar slots
    const slots: string[] = [];
    const [sh, sm] = schedule.start_time.split(':').map(Number);
    const [eh, em] = schedule.end_time.split(':').map(Number);
    let current = sh * 60 + sm;
    const end = eh * 60 + em;

    while (current + schedule.slot_duration <= end) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      const time = `${hh}:${mm}`;
      if (!bookedTimes.has(time)) slots.push(time);
      current += schedule.slot_duration;
    }

    return slots;
  },
};
