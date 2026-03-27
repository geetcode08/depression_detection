import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const params = new URLSearchParams();
          params.append("username", credentials.email);
          params.append("password", credentials.password);

          const response = await axios.post(
            `${API_BASE_URL}/auth/login`,
            params,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
          );

          const accessToken: string | undefined = response.data?.access_token;
          if (!accessToken) {
            return null;
          }

          const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          return {
            id: String(userRes.data.id),
            name: userRes.data.username,
            email: userRes.data.email,
            accessToken,
            consentGiven: userRes.data.consent_given,
            isAnonymous: userRes.data.is_anonymous,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.id = user.id;
        token.consentGiven = (user as { consentGiven?: boolean }).consentGiven;
        token.isAnonymous = (user as { isAnonymous?: boolean }).isAnonymous;
      }
      return token;
    },
    async session({ session, token }) {
      const mutableSession = session as typeof session & {
        accessToken?: string;
        consentGiven?: boolean;
        isAnonymous?: boolean;
      };

      mutableSession.user = {
        ...(session.user ?? {}),
      };
      (mutableSession.user as { id?: string }).id = (token.id as string) ?? "";
      mutableSession.accessToken = token.accessToken as string | undefined;
      mutableSession.consentGiven = token.consentGiven as boolean | undefined;
      mutableSession.isAnonymous = token.isAnonymous as boolean | undefined;

      return mutableSession;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
