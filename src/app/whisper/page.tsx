'use client'

import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  Text,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Input,
  Progress,
  Textarea,
  IconButton,
  Flex,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { AttachmentIcon, CopyIcon, DeleteIcon } from '@chakra-ui/icons'
import AppLayout from '@/components/layout/AppLayout'

interface TranscriptionResult {
  text: string
  duration?: number
  language?: string
}

export default function WhisperPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('whisper-large-v3')
  const [usage, setUsage] = useState({ used: 0, limit: 2 })
  const [result, setResult] = useState<TranscriptionResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { data: session } = useSession()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 'video/mp4']
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an audio file (MP3, WAV, M4A, MP4, WebM)',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      // Check file size (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 25MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }

      setSelectedFile(file)
      setResult(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || isLoading) return

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
    setUploadProgress(0)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('model', selectedModel)

      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      })

      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.responseText, { status: xhr.status }))
          } else {
            reject(new Error(`HTTP ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        
        xhr.open('POST', '/api/whisper')
        xhr.send(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to transcribe audio')
      }

      const data = await response.json()
      setResult({
        text: data.text,
        duration: data.duration,
        language: data.language,
      })

      // Update usage after successful request
      await fetchUsage()

      toast({
        title: 'Transcription completed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

    } catch (error: any) {
      console.error('Transcription error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to transcribe audio',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
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

  const removeFile = () => {
    setSelectedFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
                Speech to Text
              </Heading>
              <Text color="gray.400" fontSize="sm" mt={1}>
                Convert audio files to text using advanced speech recognition models
              </Text>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4} align="stretch">
                  <Box
                    border="2px"
                    borderStyle="dashed"
                    borderColor={selectedFile ? "brand.500" : "gray.600"}
                    borderRadius="md"
                    p={8}
                    textAlign="center"
                    bg={selectedFile ? "brand.50" : "gray.700"}
                    _hover={{ borderColor: "brand.500", bg: "gray.650" }}
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/mp4"
                      onChange={handleFileSelect}
                      display="none"
                    />
                    
                    {selectedFile ? (
                      <VStack spacing={3}>
                        <AttachmentIcon boxSize={8} color="brand.500" />
                        <VStack spacing={1}>
                          <Text color="white" fontWeight="semibold">
                            {selectedFile.name}
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            {formatFileSize(selectedFile.size)}
                          </Text>
                        </VStack>
                        <HStack>
                          <Button size="sm" variant="ghost" onClick={removeFile}>
                            <DeleteIcon mr={2} />
                            Remove
                          </Button>
                        </HStack>
                      </VStack>
                    ) : (
                      <VStack spacing={3}>
                        <AttachmentIcon boxSize={8} color="gray.500" />
                        <VStack spacing={1}>
                          <Text color="gray.300">
                            Click to select audio file
                          </Text>
                          <Text color="gray.500" fontSize="sm">
                            Supports MP3, WAV, M4A, MP4, WebM (max 25MB)
                          </Text>
                        </VStack>
                      </VStack>
                    )}
                  </Box>

                  {isLoading && uploadProgress > 0 && (
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" color="gray.400">
                          {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                        </Text>
                        <Text fontSize="sm" color="gray.400">
                          {uploadProgress.toFixed(0)}%
                        </Text>
                      </HStack>
                      <Progress
                        value={uploadProgress}
                        colorScheme="brand"
                        bg="gray.700"
                        borderRadius="md"
                      />
                    </Box>
                  )}
                  
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.500">
                      Model: {selectedModel}
                    </Text>
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={isLoading}
                      loadingText="Transcribing..."
                      disabled={!selectedFile || usage.used >= usage.limit}
                    >
                      Transcribe Audio
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {result && (
            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
              <Card bg="gray.800" border="1px" borderColor="gray.700">
                <CardHeader>
                  <Heading size="sm" color="brand.400">
                    Audio Info
                  </Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Stat>
                      <StatLabel color="gray.400">File Name</StatLabel>
                      <StatNumber fontSize="md" color="white">
                        {selectedFile?.name}
                      </StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel color="gray.400">File Size</StatLabel>
                      <StatNumber fontSize="md" color="white">
                        {selectedFile && formatFileSize(selectedFile.size)}
                      </StatNumber>
                    </Stat>
                    {result.duration && (
                      <Stat>
                        <StatLabel color="gray.400">Duration</StatLabel>
                        <StatNumber fontSize="md" color="white">
                          {formatDuration(result.duration)}
                        </StatNumber>
                      </Stat>
                    )}
                    {result.language && (
                      <Stat>
                        <StatLabel color="gray.400">Detected Language</StatLabel>
                        <StatNumber fontSize="md" color="white">
                          <Badge colorScheme="brand" variant="subtle">
                            {result.language.toUpperCase()}
                          </Badge>
                        </StatNumber>
                      </Stat>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              <Box gridColumn={{ base: "1", lg: "2 / 4" }}>
                <Card bg="gray.800" border="1px" borderColor="gray.700" h="100%">
                  <CardHeader>
                    <HStack justify="space-between">
                      <Heading size="sm" color="brand.400">
                        Transcription
                      </Heading>
                      <IconButton
                        icon={<CopyIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(result.text)}
                        aria-label="Copy transcription"
                      />
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Textarea
                      value={result.text}
                      readOnly
                      bg="gray.900"
                      border="1px"
                      borderColor="gray.600"
                      color="white"
                      resize="vertical"
                      minH="200px"
                      p={4}
                    />
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      {result.text.length} characters, {result.text.split(' ').length} words
                    </Text>
                  </CardBody>
                </Card>
              </Box>
            </SimpleGrid>
          )}

          <Card bg="gray.800" border="1px" borderColor="gray.700">
            <CardBody>
              <VStack spacing={3} align="start">
                <Heading size="sm" color="brand.400">
                  Supported Formats
                </Heading>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Audio:</strong> MP3, WAV, M4A, AAC, OGG, FLAC
                </Text>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Video:</strong> MP4, AVI, MOV, MKV (audio track will be extracted)
                </Text>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Max file size:</strong> 25MB
                </Text>
                <Text color="gray.300" fontSize="sm">
                  • <strong>Languages:</strong> Supports 99+ languages with automatic detection
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </AppLayout>
  )
}