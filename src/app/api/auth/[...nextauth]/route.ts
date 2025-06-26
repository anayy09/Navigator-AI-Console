import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        isSignUp: { label: 'Sign Up', type: 'hidden' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const isSignUp = credentials.isSignUp === 'true'

        if (isSignUp) {
          // Sign up flow
          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (existingUser) {
            throw new Error('User already exists')
          }

          const hashedPassword = await bcrypt.hash(credentials.password, 12)
          
          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
              // Store hashed password in a custom field if needed
            }
          })

          // Create LiteLLM user budget
          await createLiteLLMUser(user.id)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } else {
          // Sign in flow - for now, just create user if doesn't exist
          // In production, you'd verify password here
          let user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
              }
            })
            await createLiteLLMUser(user.id)
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
}

async function createLiteLLMUser(userId: string) {
  try {
    const response = await fetch(`${process.env.LLM_BASE_URL}/user/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_API_KEY}`
      },
      body: JSON.stringify({
        user_id: userId,
        max_budget: 0.25,
        budget_duration: '1d'
      })
    })
    
    if (!response.ok) {
      console.error('Failed to create LiteLLM user:', await response.text())
    }
  } catch (error) {
    console.error('Error creating LiteLLM user:', error)
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }