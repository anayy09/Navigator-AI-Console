'use client'

import { Box } from '@chakra-ui/react'
import { SessionProvider } from 'next-auth/react'
import Header from './Header'

interface AppLayoutProps {
  children: React.ReactNode
  selectedModel: string
  onModelChange: (model: string) => void
  usage: { used: number; limit: number }
}

export default function AppLayout({ children, selectedModel, onModelChange, usage }: AppLayoutProps) {
  return (
    <SessionProvider>
      <Box minH="100vh" bg="gray.900">
        <Header 
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          usage={usage}
        />
        <Box h="calc(100vh - 80px)">
          {children}
        </Box>
      </Box>
    </SessionProvider>
  )
}