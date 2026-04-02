import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code') || params.get('auth_code') || '';

      if (!code) {
        navigate('/login', { replace: true });
        return;
      }

      const resp = await apiService.exchangeAuthCode(code);
      if (resp.success) {
        await refreshUser();
        navigate('/saved-cards', { replace: true });
      } else {
        navigate('/login', { replace: true, state: { error: resp.error || 'Authentication failed' } });
      }
    };

    run();
  }, [location.search, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Finalizing sign-in…</p>
      </div>
    </div>
  );
}


