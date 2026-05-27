import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './router';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/auth.store';
import './styles/global.css';

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Auth state listener (bridge Supabase ↔ Zustand)
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setUser, clearAuth, fetchProfile, profile } = useAuthStore.getState();
  if (session?.user) {
    // Preserve existing profile/role while waiting for fetchProfile to finish
    // This prevents role flickering to null on every page reload
    setUser({ id: session.user.id, email: session.user.email! }, profile ?? null);
    await fetchProfile(session.user.id);
  } else {
    clearAuth();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>
);
