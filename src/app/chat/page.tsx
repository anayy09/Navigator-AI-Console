'use client'

import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Spinner,
  Card,
  CardBody,
  Code,
  IconButton,
  Flex,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { CopyIcon, SendIcon } from '@chakra-ui/icons'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import AppLayout from '@/components/layout/AppLayout'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama-3.1-70b-instruct')
  const [usage, setUsage] = useState({ used: 0, limit: 2 })
  const { data: session } = useSession()
  const toast = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      abortControllerRef.current = new AbortController()
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content || ''
                
                if (content) {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: msg.content + content }
                        : msg
                    )
                  )
                }
              } catch (parseError) {
                // Ignore JSON parse errors for incomplete chunks
              }
            }
          }
        }
      }

      // Update usage after successful request
      await fetchUsage()

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled
        setMessages(prev => prev.slice(0, -1))
      } else {
        console.error('Chat error:', error)
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
              : msg
          )
        )

        toast({
          title: 'Error',
          description: error.message || 'Failed to get response from AI',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
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

  const CodeBlock = ({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '')
    const language = match ? match[1] : ''
    
    return (
      <Box position="relative" my={4}>
        <HStack justify="space-between" bg="gray.800" px={4} py={2} borderTopRadius="md">
          <Text fontSize="sm" color="gray.400">
            {language || 'code'}
          </Text>
          <IconButton
            icon={<CopyIcon />}
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
            aria-label="Copy code"
          />
        </HStack>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </Box>
    )
  }

  return (
    <AppLayout
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      usage={usage}
    >
      <Container maxW="4xl" h="100%" py={4}>
        <VStack h="100%" spacing={4}>
          <Box flex="1" w="100%" overflowY="auto" pr={2}>
            <VStack spacing={4} align="stretch">
              {messages.length === 0 && (
                <Card bg="gray.800" border="1px" borderColor="gray.700">
                  <CardBody textAlign="center" py={12}>
                    <Text color="gray.400" fontSize="lg">
                      Welcome to Navigator AI Console
                    </Text>
                    <Text color="gray.500" fontSize="sm" mt={2}>
                      Start a conversation with AI models
                    </Text>
                  </CardBody>
                </Card>
              )}

              {messages.map((message) => (
                <Card
                  key={message.id}
                  bg={message.role === 'user' ? 'brand.800' : 'gray.800'}
                  border="1px"
                  borderColor={message.role === 'user' ? 'brand.600' : 'gray.700'}
                >
                  <CardBody>
                    <HStack justify="space-between" mb={2}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color={message.role === 'user' ? 'brand.200' : 'gray.300'}
                      >
                        {message.role === 'user' ? 'You' : 'AI'}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {message.timestamp.toLocaleTimeString()}
                      </Text>
                    </HStack>
                    
                    {message.role === 'user' ? (
                      <Text color="white">{message.content}</Text>
                    ) : (
                      <ReactMarkdown
                        components={{
                          code: CodeBlock,
                          p: ({ children }) => <Text mb={2} color="white">{children}</Text>,
                          ul: ({ children }) => <Box as="ul" pl={4} mb={2}>{children}</Box>,
                          ol: ({ children }) => <Box as="ol" pl={4} mb={2}>{children}</Box>,
                          li: ({ children }) => <Box as="li" mb={1} color="white">{children}</Box>,
                          h1: ({ children }) => <Text fontSize="xl" fontWeight="bold" mb={2} color="white">{children}</Text>,
                          h2: ({ children }) => <Text fontSize="lg" fontWeight="bold" mb={2} color="white">{children}</Text>,
                          h3: ({ children }) => <Text fontSize="md" fontWeight="bold" mb={2} color="white">{children}</Text>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </CardBody>
                </Card>
              ))}

              {isLoading && (
                <Card bg="gray.800" border="1px" borderColor="gray.700">
                  <CardBody>
                    <HStack>
                      <Spinner size="sm" color="brand.500" />
                      <Text color="gray.400">AI is thinking...</Text>
                    </HStack>
                  </CardBody>
                </Card>
              )}
              
              <div ref={messagesEndRef} />
            </VStack>
          </Box>

          <Box w="100%">
            <form onSubmit={handleSubmit}>
              <HStack spacing={2}>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  bg="gray.800"
                  border="1px"
                  borderColor="gray.600"
                  _hover={{ borderColor: "brand.500" }}
                  _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #1E90FF" }}
                  disabled={isLoading || usage.used >= usage.limit}
                />
                {isLoading ? (
                  <Button
                    onClick={stopGeneration}
                    colorScheme="red"
                    size="md"
                    px={6}
                  >
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    colorScheme="brand"
                    size="md"
                    px={6}
                    disabled={!input.trim() || usage.used >= usage.limit}
                    leftIcon={<SendIcon />}
                  >
                    Send
                  </Button>
                )}
              </HStack>
            </form>
          </Box>
        </VStack>
      </Container>
    </AppLayout>
  )
}