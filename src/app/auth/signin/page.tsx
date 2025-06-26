'use client'

import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Card,
  CardBody,
} from '@chakra-ui/react'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tabIndex, setTabIndex] = useState(0)
  const toast = useToast()
  const router = useRouter()

  const handleSubmit = async (isSignUp: boolean) => {
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        isSignUp: isSignUp.toString(),
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Authentication Error',
          description: result.error,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } else {
        toast({
          title: 'Success',
          description: isSignUp ? 'Account created successfully!' : 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        router.push('/chat')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }

    setIsLoading(false)
  }

  return (
    <Box minH="100vh" bg="gray.900" display="flex" alignItems="center">
      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <VStack spacing={2} textAlign="center">
            <Heading 
              size="xl" 
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
            >
              Navigator AI Console
            </Heading>
            <Text color="gray.400" fontSize="lg">
              Access the future of AI
            </Text>
          </VStack>

          <Card 
            bg="gray.800" 
            border="1px" 
            borderColor="gray.700"
            boxShadow="xl"
            w="100%"
          >
            <CardBody p={8}>
              <Tabs 
                index={tabIndex} 
                onChange={setTabIndex}
                colorScheme="brand"
                variant="soft-rounded"
              >
                <TabList mb={6} justifyContent="center">
                  <Tab>Sign In</Tab>
                  <Tab>Sign Up</Tab>
                </TabList>

                <TabPanels>
                  <TabPanel p={0}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel color="gray.300">Email</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          bg="gray.700"
                          border="1px"
                          borderColor="gray.600"
                          _hover={{ borderColor: "brand.500" }}
                          _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #1E90FF" }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.300">Password</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          bg="gray.700"
                          border="1px"
                          borderColor="gray.600"
                          _hover={{ borderColor: "brand.500" }}
                          _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #1E90FF" }}
                        />
                      </FormControl>

                      <Button
                        colorScheme="brand"
                        size="lg"
                        w="100%"
                        isLoading={isLoading}
                        onClick={() => handleSubmit(false)}
                        bg="brand.500"
                        _hover={{ bg: "brand.600" }}
                        _active={{ bg: "brand.700" }}
                      >
                        Sign In
                      </Button>
                    </VStack>
                  </TabPanel>

                  <TabPanel p={0}>
                    <VStack spacing={4}>
                      <FormControl>
                        <FormLabel color="gray.300">Email</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          bg="gray.700"
                          border="1px"
                          borderColor="gray.600"
                          _hover={{ borderColor: "brand.500" }}
                          _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #1E90FF" }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.300">Password</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          bg="gray.700"
                          border="1px"
                          borderColor="gray.600"
                          _hover={{ borderColor: "brand.500" }}
                          _focus={{ borderColor: "brand.500", boxShadow: "0 0 0 1px #1E90FF" }}
                        />
                      </FormControl>

                      <Button
                        colorScheme="brand"
                        size="lg"
                        w="100%"
                        isLoading={isLoading}
                        onClick={() => handleSubmit(true)}
                        bg="brand.500"
                        _hover={{ bg: "brand.600" }}
                        _active={{ bg: "brand.700" }}
                      >
                        Create Account
                      </Button>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>

              <Text mt={6} textAlign="center" color="gray.500" fontSize="sm">
                Continue without account for 2 free requests
              </Text>
              <Button
                variant="ghost"
                size="sm"
                w="100%"
                mt={2}
                onClick={() => router.push('/chat')}
                color="brand.400"
                _hover={{ bg: "gray.700" }}
              >
                Try as Guest
              </Button>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  )
}