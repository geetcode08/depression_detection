import { create } from "zustand";
import type { User } from "@/types";
import { authApi } from "@/lib/api";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  consentGiven: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  giveConsent: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: typeof window !== "undefined" && !!localStorage.getItem("access_token"),
  consentGiven: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await authApi.login({ email, password });
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, consentGiven: user.consent_given, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error("Login failed. Please check your credentials.");
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      await authApi.register({ username, email, password });
      await authApi.login({ email, password });
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, consentGiven: user.consent_given, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error("Registration failed. Please try again.");
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false, consentGiven: false });
  },

  fetchUser: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, isAuthenticated: true, consentGiven: user.consent_given });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  giveConsent: async () => {
    await authApi.giveConsent();
    set((s) => ({
      consentGiven: true,
      user: s.user ? { ...s.user, consent_given: true } : null,
    }));
  },

  setUser: (user) => set({ user, isAuthenticated: true, consentGiven: user.consent_given }),
}));
