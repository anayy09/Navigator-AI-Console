'use client'

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { FiMessageSquare, FiMic, FiDatabase, FiZap } from 'react-icons/fi'

export default function HomePage() {
  const router = useRouter()

  const features = [
    {
      icon: FiMessageSquare,
      title: 'Chat & Code',
      description: 'Access powerful language models for conversations and code generation',
    },
    {
      icon: FiDatabase,
      title: 'Embeddings',
      description: 'Generate high-quality text embeddings for semantic search',
    },
    {
      icon: FiMic,
      title: 'Speech',
      description: 'Convert speech to text with state-of-the-art models',
    },
    {
      icon: FiZap,
      title: 'Experiments',
      description: 'Try cutting-edge experimental models and features',
    },
  ]

  return (
    <Box minH="100vh" bg="gray.900">
      <Container maxW="6xl" py={20}>
        <VStack spacing={12} textAlign="center">
          <VStack spacing={6}>
            <Heading 
              size="2xl" 
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
            >
              Navigator AI Console
            </Heading>
            <Text fontSize="xl" color="gray.400" maxW="2xl">
              A futuristic interface to access multiple AI models through the Navigator AI Gateway. 
              Experience the future of artificial intelligence.
            </Text>
          </VStack>

          <HStack spacing={4}>
            <Button
              colorScheme="brand"
              size="lg"
              onClick={() => router.push('/chat')}
              bg="brand.500"
              _hover={{ bg: "brand.600" }}
            >
              Start Chatting
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/auth/signin')}
              borderColor="brand.500"
              color="brand.400"
              _hover={{ bg: "brand.500", color: "white" }}
            >
              Sign In
            </Button>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="100%">
            {features.map((feature, index) => (
              <Card 
                key={index}
                bg="gray.800" 
                border="1px" 
                borderColor="gray.700"
                _hover={{ borderColor: "brand.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <CardBody textAlign="center" p={6}>
                  <VStack spacing={4}>
                    <Box
                      p={3}
                      borderRadius="full"
                      bg="brand.500"
                      color="white"
                    >
                      <Icon as={feature.icon} boxSize={6} />
                    </Box>
                    <Heading size="md" color="white">
                      {feature.title}
                    </Heading>
                    <Text color="gray.400" fontSize="sm">
                      {feature.description}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Box 
            p={6} 
            bg="gray.800" 
            borderRadius="lg" 
            border="1px" 
            borderColor="gray.700"
            maxW="lg"
          >
            <VStack spacing={3}>
              <Text color="brand.400" fontWeight="semibold">
                Get Started
              </Text>
              <Text color="gray.300" fontSize="sm" textAlign="center">
                • 2 free requests as a guest<br />
                • 10 requests per day with an account<br />
                • Access to all available models
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}