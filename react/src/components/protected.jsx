// react/src/components/Protected.jsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '/src/lib/supabase.js';

/**
 * Estados:
 * - 'checking' : validando sessão (mostra loader, não some conteúdo do nada)
 * - 'authed'   : renderiza children
 * - 'noauth'   : redireciona para /login
 */
export default function Protected({ children }) {
  const [status, setStatus] = useState('checking');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // 1) Checagem imediata (evita "piscar")
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) setStatus('authed');
      else {
        setStatus('noauth');
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
    });

    // 2) Acompanhar mudanças (inclui INITIAL_SESSION no v2)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'INITIAL_SESSION') {
        // primeira leitura segura
        if (session) setStatus('authed');
        else {
          setStatus('noauth');
          navigate('/login', { replace: true, state: { from: location.pathname } });
        }
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setStatus('authed');
      }

      if (event === 'SIGNED_OUT') {
        setStatus('noauth');
        navigate('/login', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (status === 'checking') {
    // Loader simples enquanto valida — assim não "pisca" nem fica branco
    return (
      <div style={{
        minHeight:'100vh', display:'grid', placeItems:'center',
        color:'#555', fontFamily:'system-ui, sans-serif'
      }}>
        Validando sessão…
      </div>
    );
  }

  if (status !== 'authed') return null; // navegação já foi disparada
  return children;
}
