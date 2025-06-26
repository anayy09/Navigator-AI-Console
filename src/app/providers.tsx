'use client'

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'

const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#E6F3FF' },
          100: { value: '#B3D9FF' },
          200: { value: '#80BFFF' },
          300: { value: '#4DA6FF' },
          400: { value: '#1A8CFF' },
          500: { value: '#1E90FF' },
          600: { value: '#0066CC' },
          700: { value: '#004C99' },
          800: { value: '#003366' },
          900: { value: '#001933' },
        },
      },
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>
}