import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { UserRole } from '../types';

interface Props {
  children: ReactNode;
  roles: UserRole[];
}

export function RoleRoute({ children, roles }: Props) {
  const { role } = useAuthStore();
  if (!role || !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
