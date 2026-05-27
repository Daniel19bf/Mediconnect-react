import { supabase } from '../lib/supabase';
import type { DashboardStats } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const [
      { count: totalPatients },
      { count: activeDoctors },
      { count: scheduledAppts },
      { count: completedConsult },
      { count: videoCalls },
      { data: apptBySpec },
      { data: patientsByMonth },
    ] = await Promise.all([
      supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_available', true),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).in('status', ['pending','confirmed']),
      supabase.from('consultations').select('*', { count: 'exact', head: true }),
      supabase.from('video_calls').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('appointments')
        .select('specialty:specialties(name), count:id')
        .not('specialty_id', 'is', null)
        .in('status', ['completed','confirmed'])
        .limit(8),
      Promise.resolve({ data: [] }),
    ]);

    return {
      total_patients: totalPatients ?? 0,
      active_doctors: activeDoctors ?? 0,
      scheduled_appointments: scheduledAppts ?? 0,
      completed_consultations: completedConsult ?? 0,
      video_calls_done: videoCalls ?? 0,
      monthly_revenue: 0, // calcular con consultas * tarifa
      appointments_by_specialty: (apptBySpec ?? []).map((r: { specialty: { name: string } | null; count: number }) => ({
        specialty: r.specialty?.name ?? 'Sin especialidad',
        count: r.count,
      })),
      patients_by_month: patientsByMonth ?? [],
      appointments_trend: [],
    };
  },
};
