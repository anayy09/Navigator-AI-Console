import { NextResponse } from 'next/server'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: any) {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  // LiteLLM specific errors
  if (error.status === 401) {
    return NextResponse.json(
      { error: 'Budget limit exceeded. Please try again tomorrow.' },
      { status: 429 }
    )
  }

  if (error.status === 429) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    )
  }

  // OpenAI API errors
  if (error.code === 'insufficient_quota') {
    return NextResponse.json(
      { error: 'API quota exceeded. Please contact support.' },
      { status: 429 }
    )
  }

  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.' },
      { status: 503 }
    )
  }

  // Default server error
  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again.' },
    { status: 500 }
  )
}