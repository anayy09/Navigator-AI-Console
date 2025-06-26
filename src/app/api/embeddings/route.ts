import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { checkAndIncrementUsage } from '@/lib/usage'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    const { input, model } = body

    if (!input) {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      )
    }

    // Check usage limits
    const userId = session?.user?.id
    const { allowed } = await checkAndIncrementUsage(userId)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily quota exhausted. Try again tomorrow.' },
        { status: 429 }
      )
    }

    // Make request to LiteLLM
    const response = await client.embeddings.create({
      model: model || 'nomic-embed-text-v1.5',
      input,
      ...(userId && { user: userId }),
    })

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Embeddings API error:', error)
    
    if (error.status === 401 || error.status === 429) {
      return NextResponse.json(
        { error: error.message || 'Budget limit exceeded' },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}