import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Paperclip, Search, MessageSquare } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { chatService } from '../../services/chat.service';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn, timeAgo } from '../../lib/utils';
import type { Message } from '../../types';
import { supabase } from '../../lib/supabase';

export default function ChatPage() {
  const { userId: targetUserId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<{ profile_id: string; full_name: string; avatar_url: string; last_message: string; unread: number }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation
  useEffect(() => {
    if (!user || !targetUserId) return;
    chatService.getConversation(user.id, targetUserId).then(setMessages);
    chatService.markAsRead(targetUserId, user.id);
  }, [user, targetUserId]);

  // Load contacts
  useEffect(() => {
    if (!user) return;
    chatService.getContacts(user.id).then(setContacts as (v: typeof contacts) => void);
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = chatService.subscribeToMessages(user.id, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Auto scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMutation = useMutation({
    mutationFn: () => chatService.send(user!.id, targetUserId!, message),
    onSuccess: (msg) => {
      setMessages(prev => [...prev, msg]);
      setMessage('');
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !targetUserId) return;
    sendMutation.mutate();
  };

  const activeContact = contacts.find(c => c.profile_id === targetUserId);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-card">
      {/* Contacts sidebar */}
      <div className="w-64 border-r border-gray-100 dark:border-gray-700 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input placeholder="Buscar..." className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400" />
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
          {contacts.length === 0 ? (
            <li className="p-6 text-center text-xs text-gray-400">Sin conversaciones</li>
          ) : (
            contacts.map(c => (
              <li key={c.profile_id}>
                <a href={`/chat/${c.profile_id}`} className={cn('flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors', c.profile_id === targetUserId && 'bg-primary-50 dark:bg-primary-900/20')}>
                  <Avatar name={c.full_name} size="sm" online />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.last_message}</p>
                  </div>
                  {c.unread > 0 && <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{c.unread}</span>}
                </a>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Chat area */}
      {targetUserId ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <Avatar name={activeContact?.full_name ?? '?'} online />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{activeContact?.full_name ?? 'Usuario'}</p>
              <p className="text-xs text-green-500">En línea</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
                  {!isMe && <Avatar name={activeContact?.full_name ?? '?'} size="sm" />}
                  <div className={cn('max-w-xs lg:max-w-md', isMe && 'items-end')}>
                    <div className={cn('px-4 py-2.5 rounded-2xl text-sm', isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-tl-sm')}>
                      {msg.content}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-1">{timeAgo(msg.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <Button type="submit" loading={sendMutation.isPending} disabled={!message.trim()} icon={<Send className="w-4 h-4" />} size="sm">
              Enviar
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-400">
          <MessageSquare className="w-16 h-16 text-gray-200 dark:text-gray-700" />
          <p className="text-sm">Selecciona una conversación para comenzar</p>
        </div>
      )}
    </div>
  );
}
