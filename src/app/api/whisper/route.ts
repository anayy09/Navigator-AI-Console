import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkAndIncrementUsage } from '@/lib/usage'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const formData = await req.formData()
    const file = formData.get('file') as File
    const model = formData.get('model') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Audio file is required' },
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
    const response = await client.audio.transcriptions.create({
      file,
      model: model || 'whisper-large-v3',
      ...(userId && { user: userId }),
    })

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Whisper API error:', error)
    
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