import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { users, accounts, sessions, verificationTokens } from '@acme/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

/**
 * NextAuth v5 Configuration
 * - Email/magic link authentication
 * - OAuth (Google)
 * - Role-based access control
 * - Drizzle ORM adapter
 */

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60, // 24 hours
    }),
    
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!passwordMatch) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.email = user.email

        // Fetch user role from database
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        })
        
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as 'user' | 'analyst' | 'admin'
      }

      return session
    },

    async signIn({ user, account, profile, email, credentials }) {
      // Email verification (optional)
      if (email?.verificationRequest) {
        return true
      }

      // OAuth auto-signup
      if (account && (account.provider === 'google')) {
        return true
      }

      // Credentials signup (create new user if doesn't exist)
      if (credentials) {
        return true
      }

      return true
    },
  },

  events: {
    async signIn({ user }) {
      console.log(`[Auth] User signed in: ${user.email}`)
    },
    async signOut({ token }) {
      console.log(`[Auth] User signed out`)
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}
