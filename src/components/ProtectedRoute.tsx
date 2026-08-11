import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [tookTooLong, setTookTooLong] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (loading) {
      timer = setTimeout(() => {
        setTookTooLong(true);
      }, 3000);
    } else {
      setTookTooLong(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm mb-4">Loading application...</p>
        {tookTooLong && (
          <div className="animate-fade-in space-y-3">
            <p className="text-xs text-slate-500">Connecting to database taking longer than usual?</p>
            <Link 
              to="/login" 
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
