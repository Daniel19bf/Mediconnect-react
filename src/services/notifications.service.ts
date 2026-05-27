import { supabase } from '../lib/supabase';
import type { Notification } from '../types';

export const notificationsService = {
  async getAll(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data as Notification[];
  },

  async markRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  },

  async markAllRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  },

  async create(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase.from('notifications').insert(notification).select().single();
    if (error) throw error;
    return data as Notification;
  },

  subscribe(userId: string, callback: (n: Notification) => void) {
    return supabase
      .channel(`notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => callback(payload.new as Notification))
      .subscribe();
  },
};
