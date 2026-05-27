import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleCollapsed: () => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  darkMode: false,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCollapsed: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleDarkMode: () => set(s => {
    const next = !s.darkMode;
    document.documentElement.classList.toggle('dark', next);
    return { darkMode: next };
  }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
