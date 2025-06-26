import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.ANON_TOKEN_SECRET!)

export async function createAnonToken(): Promise<string> {
  const token = await new SignJWT({ type: 'anon' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)
  
  return token
}

export async function verifyAnonToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function getOrCreateAnonToken(): Promise<string> {
  const cookieStore = cookies()
  const existingToken = cookieStore.get('anon_token')?.value

  if (existingToken && await verifyAnonToken(existingToken)) {
    return existingToken
  }

  const newToken = await createAnonToken()
  cookieStore.set('anon_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 // 24 hours
  })

  return newToken
}