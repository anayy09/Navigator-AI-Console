'use client'

import {
  Box,
  Container,
  VStack,
  HStack,
  Textarea,
  Button,
  Text,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Code,
  IconButton,
  Flex,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { CopyIcon } from '@chakra-ui/icons'
import AppLayout from '@/components/layout/AppLayout'

interface EmbeddingResult {
  embedding: number[]
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

export default function EmbedPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('nomic-embed-text-v1.5')
  const [usage, setUsage] = useState({ used: 0, limit: 2 })
  const [result, setResult] = useState<EmbeddingResult | null>(null)
  const { data: session } = useSession()
  const toast = useToast()

  useEffect(() => {
    fetchUsage()
  }, [session])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (usage.used >= usage.limit) {
      toast({
        title: 'Daily quota exhausted',
        description: 'Try again tomorrow or sign up for more requests.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: input.trim(),
          model: selectedModel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate embeddings')
      }

      const data = await response.json()
      setResult({
        embedding: data.data[0].embedding,
        usage: data.usage,
      })

      // Update usage after successful request
      await fetchUsage()

      toast({
        title: 'Embeddings generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

    } catch (error: any) {
      console.error('Embeddings error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate embeddings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const copyEmbedding = () => {
    if (result) {
      copyToClipboard(JSON.stringify(result.embedding, null, 2))
    }
  }

  const copyVector = () => {
    if (result) {
      copyToClipboard(result.embedding.join(', '))
    }
  }

  return (
    <AppLayout
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      usage={usage}
    >
      <Container maxW="6xl" py={6}>
        <VStack spacing={6} align="stretch">
          <Card bg="gray.800" border="1px" borderColor="gray.700">
            <CardHeader>
              <Heading size="md" color="brand.400">
                Text Embeddings
              </Heading>
              <Text color="gray.400" fontSize="sm" mt={1}>
                Generate high-dimensional vector representations of text for semantic search and similarity matching
              </Text>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4} align="stretch">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter text to embed... (e.g., 'Machine learning is a subset of artificial intelligence')"
                    bg="gray.700"
                    border="1px"
                    borderColor="gray.600"
                    _hover={{ borderColor: "brand.500" }}
                    _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #1E90FF" }}
                    resize="vertical"
                    minH="120px"
                    disabled={isLoading || usage.used >= usage.limit}
                  />
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.500">
                      Model: {selectedModel}
                    </Text>
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={isLoading}
                      loadingText="Generating..."
                      disabled={!input.trim() || usage.used >= usage.limit}
                    >
                      Generate Embeddings
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {result && (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card bg="gray.800" border="1px" borderColor="gray.700">
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="sm" color="brand.400">
                      Vector Statistics
                    </Heading>
                    <Badge colorScheme="brand" variant="subtle">
                      {result.embedding.length}D
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat>
                      <StatLabel color="gray.400">Dimensions</StatLabel>
                      <StatNumber color="white">{result.embedding.length}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="gray.400">Magnitude</StatLabel>
                      <StatNumber color="white">
                        {Math.sqrt(result.embedding.reduce((sum, val) => sum + val * val, 0)).toFixed(4)}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="gray.400">Min Value</StatLabel>
                      <StatNumber color="white">
                        {Math.min(...result.embedding).toFixed(4)}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="gray.400">Max Value</StatLabel>
                      <StatNumber color="white">
                        {Math.max(...result.embedding).toFixed(4)}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  <VStack spacing={3} mt={4} align="stretch">
                    <Text fontSize="sm" color="gray.400">Token Usage:</Text>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.300">Prompt Tokens:</Text>
                      <Text fontSize="sm" color="white">{result.usage.prompt_tokens}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.300">Total Tokens:</Text>
                      <Text fontSize="sm" color="white">{result.usage.total_tokens}</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              <Card bg="gray.800" border="1px" borderColor="gray.700">
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="sm" color="brand.400">
                      Vector Preview
                    </Heading>
                    <HStack>
                      <Button size="sm" variant="ghost" onClick={copyVector}>
                        Copy as CSV
                      </Button>
                      <IconButton
                        icon={<CopyIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={copyEmbedding}
                        aria-label="Copy JSON"
                      />
                    </HStack>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Box
                    bg="gray.900"
                    p={4}
                    borderRadius="md"
                    border="1px"
                    borderColor="gray.600"
                    maxH="300px"
                    overflowY="auto"
                  >
                    <Code
                      fontSize="xs"
                      color="gray.300"
                      bg="transparent"
                      whiteSpace="pre-wrap"
                      wordBreak="break-all"
                    >
                      [{'\n'}
                      {result.embedding.slice(0, 10).map((val, idx) => (
                        `  ${val.toFixed(6)}${idx < 9 ? ',' : ''}\n`
                      )).join('')}
                      {result.embedding.length > 10 && `  ... ${result.embedding.length - 10} more values\n`}
                      ]
                    </Code>
                  </Box>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    Showing first 10 values. Click copy to get the full vector.
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}

          <Card bg="gray.800" border="1px" borderColor="gray.700">
            <CardBody>
              <VStack spacing={3} align="start">
                <Heading size="sm" color="brand.400">
                  Use Cases
                </Heading>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Semantic Search:</strong> Find similar documents or passages
                </Text>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Clustering:</strong> Group similar texts together
                </Text>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Recommendation:</strong> Suggest related content
                </Text>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Classification:</strong> Categorize text automatically
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </AppLayout>
  )
}