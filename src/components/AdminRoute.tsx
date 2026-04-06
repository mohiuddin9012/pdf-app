import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">লোড হচ্ছে...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  return <>{children}</>;
}
