import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { authApi } from "@/lib/api";

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydratedSession: boolean;
  consentGiven: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  startAnonymous: () => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  fetchUser: () => Promise<void>;
  hydrateSession: () => void;
  giveConsent: () => Promise<void>;
  setConsentGiven: (val: boolean) => void;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  clearUser: () => void;
}

const ACCESS_TOKEN_KEY = "access_token";

function setTokenCookie(token: string, expSeconds: number = 60 * 60 * 24 * 7) {
  document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=${expSeconds}; samesite=lax`;
}

function clearTokenCookie() {
  document.cookie = "access_token=; path=/; max-age=0; samesite=lax";
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydratedSession: false,
      consentGiven: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const auth = await authApi.login({ email, password });
          localStorage.setItem(ACCESS_TOKEN_KEY, auth.access_token);
          setTokenCookie(auth.access_token);

          const user = await authApi.getMe();
          set({
            user,
            token: auth.access_token,
            isAuthenticated: true,
            consentGiven: user.consent_given,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          await authApi.register({ username, email, password });
          set({ isLoading: false });
        } catch {
          set({ isLoading: false });
          throw new Error("Registration failed");
        }
      },

      startAnonymous: async () => {
        set({ isLoading: true });
        try {
          const auth = await authApi.createAnonymous();
          localStorage.setItem(ACCESS_TOKEN_KEY, auth.access_token);
          setTokenCookie(auth.access_token);
          set({
            token: auth.access_token,
            isAuthenticated: true,
            consentGiven: false,
            isLoading: false,
          });
          await get().fetchUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        authApi.logout();
        clearTokenCookie();
        set({ user: null, token: null, isAuthenticated: false, consentGiven: false });
      },

      deleteAccount: async () => {
        await authApi.deleteAccount();
        clearTokenCookie();
        set({ user: null, token: null, isAuthenticated: false, consentGiven: false });
      },

      hydrateSession: () => {
        const token = get().token ?? localStorage.getItem(ACCESS_TOKEN_KEY);
        if (!token) {
          clearTokenCookie();
          set({
            hasHydratedSession: true,
            token: null,
            user: null,
            isAuthenticated: false,
            consentGiven: false,
          });
          return;
        }

        if (token && !get().token) {
          setTokenCookie(token);
        }

        set({ hasHydratedSession: true, token, isAuthenticated: true });
      },

      fetchUser: async () => {
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, consentGiven: user.consent_given });
        } catch {
          clearTokenCookie();
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          set({ user: null, token: null, isAuthenticated: false, consentGiven: false });
        }
      },

      giveConsent: async () => {
        await authApi.giveConsent();
        set((s) => ({
          consentGiven: true,
          user: s.user ? { ...s.user, consent_given: true } : null,
        }));
      },

      setConsentGiven: (val) =>
        set((s) => ({
          consentGiven: val,
          user: s.user ? { ...s.user, consent_given: val } : null,
        })),

      setUser: (user) => set({ user, isAuthenticated: true, consentGiven: user.consent_given }),
      setToken: (token) => {
        if (token) {
          localStorage.setItem(ACCESS_TOKEN_KEY, token);
          setTokenCookie(token);
        } else {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          clearTokenCookie();
        }
        set({ token, isAuthenticated: Boolean(token) });
      },
      clearUser: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        clearTokenCookie();
        set({ user: null, token: null, isAuthenticated: false, consentGiven: false });
      },
    }),
    {
      name: "depression-ai-user",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        consentGiven: state.consentGiven,
      }),
    }
  )
);
