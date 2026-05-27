import { supabase } from '../lib/supabase';
import type { Message } from '../types';

export const chatService = {
  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles!sender_id(*)')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at');
    if (error) throw error;
    return data as Message[];
  },

  async send(senderId: string, receiverId: string, content: string, fileData?: { file_url: string; file_name: string; mime_type: string }): Promise<Message> {
    const { data, error } = await supabase.from('messages').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      ...fileData,
    }).select('*, sender:profiles!sender_id(*)').single();
    if (error) throw error;
    return data as Message;
  },

  async markAsRead(senderId: string, receiverId: string) {
    await supabase.from('messages')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .neq('status', 'read');
  },

  async getContacts(userId: string): Promise<{ profile_id: string; full_name: string; avatar_url: string; last_message: string; unread: number }[]> {
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, created_at, status')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!data) return [];

    const contactMap = new Map<string, { last_message: string; unread: number }>();
    data.forEach(m => {
      const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
      if (!contactMap.has(otherId)) {
        contactMap.set(otherId, {
          last_message: m.content ?? '',
          unread: m.receiver_id === userId && m.status !== 'read' ? 1 : 0,
        });
      } else if (m.receiver_id === userId && m.status !== 'read') {
        contactMap.get(otherId)!.unread++;
      }
    });

    const profiles = await Promise.all(
      Array.from(contactMap.keys()).map(async id => {
        const { data: p } = await supabase.from('profiles').select('id,full_name,avatar_url').eq('id', id).single();
        return { ...p, ...contactMap.get(id) };
      })
    );

    return profiles as typeof profiles;
  },

  subscribeToMessages(userId: string, callback: (msg: Message) => void) {
    return supabase
      .channel(`messages-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, payload => callback(payload.new as Message))
      .subscribe();
  },
};
