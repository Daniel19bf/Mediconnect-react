import { ElementType, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  color?: string;
  change?: number;
  subtitle?: string;
  children?: ReactNode;
}

export function StatCard({ title, value, icon: Icon, color = 'bg-primary-500', change, subtitle, children }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', change >= 0 ? 'text-green-600' : 'text-red-500')}>
              {change >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{Math.abs(change)}% vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {children}
    </Card>
  );
}
