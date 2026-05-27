import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.username || !credentials?.password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: {
          username: credentials.username as string,
        },
      });

      if (!user || !user.password) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password as string,
        user.password
      );

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        name: user.username,
        email: user.email,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          const email = user.email;
          if (!email) return '/login?error=oauth';

          let dbUser = await prisma.user.findUnique({ where: { email } });

          if (!dbUser) {
            let baseUsername = (user.name || 'user')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '_')
              .replace(/^_+|_+$/g, '')
              .slice(0, 20);
            if (!baseUsername) baseUsername = 'user';

            let username = baseUsername;
            let counter = 1;
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername.slice(0, 15)}_${counter}`;
              counter++;
            }

            dbUser = await prisma.user.create({
              data: { username, email, image: user.image },
            });
          } else if (user.image && dbUser.image !== user.image) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { image: user.image },
            });
          }

          user.id = dbUser.id;
          return true;
        } catch {
          return '/login?error=oauth';
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
