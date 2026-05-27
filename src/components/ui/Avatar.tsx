import { cn, getInitials } from '../../lib/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  online?: boolean;
}

const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };

export function Avatar({ name, src, size = 'md', className, online }: AvatarProps) {
  return (
    <div className="relative inline-flex flex-shrink-0">
      <div className={cn('rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-medical-teal flex items-center justify-center text-white font-semibold', sizes[size], className)}>
        {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <span>{name ? getInitials(name) : '?'}</span>}
      </div>
      {online !== undefined && (
        <span className={cn('absolute bottom-0 right-0 block rounded-full border-2 border-white dark:border-gray-800', online ? 'bg-green-400' : 'bg-gray-300', size === 'xs' ? 'w-1.5 h-1.5' : 'w-2.5 h-2.5')} />
      )}
    </div>
  );
}
