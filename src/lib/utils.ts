import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInYears } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy') {
  return format(new Date(date), fmt, { locale: es });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function calcAge(birthDate: string): number {
  return differenceInYears(new Date(), new Date(birthDate));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function generateRoomName(): string {
  return `mediconnect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmada',
  in_progress: 'En proceso',
  completed:   'Completada',
  cancelled:   'Cancelada',
  no_show:     'No asistió',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800',
  confirmed:   'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-800',
  no_show:     'bg-gray-100 text-gray-800',
};

export const DAYS_OF_WEEK = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
