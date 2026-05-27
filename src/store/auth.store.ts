import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthState['user'], profile: Profile | null) => void;
  setProfile: (profile: Profile) => void;
  clearAuth: () => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      role: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user, profile) => set((state) => ({
        user,
        // If new profile is null, keep the persisted one so role doesn't flicker
        profile: profile ?? state.profile,
        role: profile?.role ?? state.role ?? null,
        isAuthenticated: !!user,
      })),

      setProfile: (profile) => set({ profile, role: profile.role }),

      clearAuth: () => set({ user: null, profile: null, role: null, isAuthenticated: false }),

      fetchProfile: async (userId) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (error) {
            console.error('[MediConnect] Error cargando perfil:', error.message);
          }
          if (data) {
            set({
              profile: data as Profile,
              role: (data as Profile).role,
              isAuthenticated: true,
            });
          }
        } catch (err) {
          console.error('[MediConnect] fetchProfile error:', err);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'mediconnect-auth',
      partialize: (state) => ({ user: state.user, profile: state.profile, role: state.role }),
    }
  )
);
