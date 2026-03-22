// next-auth configuration stub.
// Wire up to the FastAPI backend when ready.
//
// For MVP with mock data, auth is handled via Zustand + localStorage.
// When backend is available, configure providers here:
//
// import CredentialsProvider from "next-auth/providers/credentials";
// import type { NextAuthOptions } from "next-auth";
//
// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(credentials),
//         });
//         const data = await res.json();
//         if (res.ok && data.access_token) return { id: "1", ...data };
//         return null;
//       },
//     }),
//   ],
//   session: { strategy: "jwt" },
//   pages: {
//     signIn: "/login",
//     newUser: "/register",
//   },
// };

export {};
