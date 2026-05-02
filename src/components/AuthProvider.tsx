import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const loadUser = useAuthStore((state) => state.loadUser);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!hasLoaded.current) {
      loadUser();
      hasLoaded.current = true;
    }
  }, [loadUser]);

  return <>{children}</>;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
