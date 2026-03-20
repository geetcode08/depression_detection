"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/api";
import type { User } from "@/types";

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  consentGiven: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  giveConsent: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  continueAsGuest: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      consentGiven: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.login({ email, password });
          const user = await authApi.getMe();
          set({
            user,
            isAuthenticated: true,
            consentGiven: user.consent_given,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Login failed",
          });
          throw err;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register({ username, email, password });
          // After register, auto-login
          await authApi.login({ email, password });
          const user = await authApi.getMe();
          set({
            user,
            isAuthenticated: true,
            consentGiven: user.consent_given,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Registration failed",
          });
          throw err;
        }
      },

      logout: () => {
        authApi.logout();
        set({
          user: null,
          isAuthenticated: false,
          consentGiven: false,
          error: null,
        });
      },

      giveConsent: async () => {
        set({ isLoading: true });
        try {
          await authApi.giveConsent();
          set((state) => ({
            consentGiven: true,
            user: state.user ? { ...state.user, consent_given: true } : state.user,
            isLoading: false,
          }));
        } catch {
          // Optimistic update even if API fails (mock mode)
          set((state) => ({
            consentGiven: true,
            user: state.user ? { ...state.user, consent_given: true } : state.user,
            isLoading: false,
          }));
        }
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, consentGiven: user.consent_given, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      continueAsGuest: () => {
        const guestId = typeof window !== "undefined"
          ? localStorage.getItem("guest_uuid") ?? crypto.randomUUID()
          : crypto.randomUUID();
        if (typeof window !== "undefined") {
          localStorage.setItem("guest_uuid", guestId);
        }
        const guestUser: User = {
          id: -1,
          username: "Guest",
          email: "",
          is_anonymous: true,
          consent_given: true,
          created_at: new Date().toISOString(),
        };
        set({
          user: guestUser,
          isAuthenticated: true,
          consentGiven: true,
        });
      },
    }),
    {
      name: "aura-user-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        consentGiven: state.consentGiven,
      }),
    }
  )
);
