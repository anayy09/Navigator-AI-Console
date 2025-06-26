'use client'

import {
  Box,
  Flex,
  Heading,
  Button,
  Select,
  Progress,
  Text,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Link,
} from '@chakra-ui/react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDownIcon } from '@chakra-ui/icons'
import NextLink from 'next/link'

interface HeaderProps {
  selectedModel: string
  onModelChange: (model: string) => void
  usage: { used: number; limit: number }
}

const models = {
  chat: [
    { value: 'codestral-22b', label: 'Codestral 22B' },
    { value: 'gemma-3-27b-it', label: 'Gemma 3 27B' },
    { value: 'granite-3.1-8b-instruct', label: 'Granite 3.1 8B' },
    { value: 'kokoro', label: 'Kokoro' },
    { value: 'llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
    { value: 'llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
    { value: 'llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
    { value: 'mistral-7b-instruct', label: 'Mistral 7B' },
    { value: 'mistral-small-3.1', label: 'Mistral Small 3.1' },
    { value: 'mixtral-8x7b-instruct', label: 'Mixtral 8x7B' },
  ],
  embeddings: [
    { value: 'gte-large-en-v1.5', label: 'GTE Large EN v1.5' },
    { value: 'nomic-embed-text-v1.5', label: 'Nomic Embed v1.5' },
    { value: 'sfr-embedding-mistral', label: 'SFR Embedding Mistral' },
  ],
  speech: [
    { value: 'whisper-large-v3', label: 'Whisper Large v3' },
  ],
  experiments: [
    { value: 'flux.1-dev', label: 'Flux.1 Dev' },
    { value: 'flux.1-schnell', label: 'Flux.1 Schnell' },
    { value: 'llama-3.1-nemotron-nano-8B-v1', label: 'Llama Nemotron Nano 8B' },
  ]
}

const navigationLinks = [
  { href: '/chat', label: 'Chat' },
  { href: '/embed', label: 'Embeddings' },
  { href: '/whisper', label: 'Speech' },
]

export default function Header({ selectedModel, onModelChange, usage }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const toast = useToast()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
    router.push('/')
  }

  const getAllModels = () => {
    return [
      ...models.chat,
      ...models.embeddings,
      ...models.speech,
      ...models.experiments,
    ].sort((a, b) => a.label.localeCompare(b.label))
  }

  const usagePercentage = (usage.used / usage.limit) * 100

  return (
    <Box 
      bg="gray.800" 
      borderBottom="1px" 
      borderColor="gray.700"
      px={6} 
      py={4}
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={8}>
          <Heading 
            size="md" 
            bgGradient="linear(to-r, brand.400, brand.600)"
            bgClip="text"
            cursor="pointer"
            onClick={() => router.push('/chat')}
          >
            Navigator AI
          </Heading>

          {/* Navigation Links */}
          <HStack spacing={1}>
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                as={NextLink}
                href={link.href}
                px={3}
                py={2}
                borderRadius="md"
                color={pathname === link.href ? "brand.400" : "gray.300"}
                bg={pathname === link.href ? "gray.700" : "transparent"}
                _hover={{
                  color: "brand.400",
                  bg: "gray.700",
                  textDecoration: "none"
                }}
                fontSize="sm"
                fontWeight="medium"
              >
                {link.label}
              </Link>
            ))}
          </HStack>

          <Select
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            bg="gray.700"
            border="1px"
            borderColor="gray.600"
            w="250px"
            size="sm"
            _hover={{ borderColor: "brand.500" }}
            _focus={{ borderColor: "brand.500" }}
          >
            {getAllModels().map((model) => (
              <option key={model.value} value={model.value} style={{ backgroundColor: '#2D3748' }}>
                {model.label}
              </option>
            ))}
          </Select>
        </HStack>

        <HStack spacing={4}>
          <Box textAlign="right" minW={150}>
            <Text fontSize="sm" color="gray.400">
              Usage: {usage.used}/{usage.limit}
            </Text>
            <Progress
              value={usagePercentage}
              size="sm"
              colorScheme={usagePercentage > 80 ? 'red' : 'brand'}
              bg="gray.700"
              borderRadius="md"
            />
          </Box>

          {session?.user ? (
            <Menu>
              <MenuButton as={Button} variant="ghost" p={2} size="sm">
                <HStack>
                  <Avatar 
                    size="sm" 
                    name={session.user.name || session.user.email || 'User'} 
                    bg="brand.500"
                  />
                  <ChevronDownIcon />
                </HStack>
              </MenuButton>
              <MenuList bg="gray.700" border="1px" borderColor="gray.600">
                <MenuItem 
                  bg="gray.700" 
                  _hover={{ bg: "gray.600" }}
                  onClick={handleSignOut}
                >
                  Sign Out
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Button
              colorScheme="brand"
              size="sm"
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  )
}