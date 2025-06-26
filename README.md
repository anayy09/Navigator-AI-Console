# Navigator AI Console

A web console for accessing multiple AI models through the Navigator AI Gateway.

## Features

- 🤖 **Multi-Model Chat**: Access various LLMs including Llama, Mixtral, Mistral, and more
- 🔢 **Text Embeddings**: Generate high-quality embeddings for semantic search
- 🎤 **Speech-to-Text**: Convert audio files to text using Whisper models
- 🚀 **Streaming Responses**: Real-time token-by-token streaming
- 📊 **Usage Tracking**: Built-in rate limiting and budget management
- 🔐 **Authentication**: Secure user accounts with session management
- 🎨 **Modern UI**: Dark-mode first design with Chakra UI
- 📱 **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Chakra UI
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for anonymous user tracking
- **AI Gateway**: LiteLLM proxy for model access
- **Deployment**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd navigator-console
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start services and setup database**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d
   
   # Install dependencies
   npm install
   
   # Setup database
   npx prisma migrate dev
   npx prisma generate
   
   # Optional: Seed database
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `LLM_BASE_URL`: Your LiteLLM gateway URL
- `LLM_API_KEY`: Your LiteLLM master key
- `NEXTAUTH_SECRET`: Secret key for NextAuth
- `ANON_TOKEN_SECRET`: Secret for anonymous user tokens

## Usage Limits

- **Anonymous users**: 2 requests per 24 hours
- **Registered users**: 10 requests per 24 hours
- **LiteLLM budget**: $0.25 per user per day (configurable)

## API Endpoints

- `POST /api/chat` - Chat completions with streaming
- `POST /api/embeddings` - Generate text embeddings
- `POST /api/whisper` - Speech-to-text transcription
- `GET /api/usage` - Get current usage stats
- `GET /api/status` - System health check

## Available Models

### Chat/Code Models
- Llama 3.1 70B Instruct
- Llama 3.3 70B Instruct  
- Mixtral 8x7B Instruct
- Mistral 7B Instruct
- Codestral 22B
- And more...

### Embedding Models
- Nomic Embed Text v1.5
- SFR Embedding Mistral
- GTE Large EN v1.5

### Speech Models
- Whisper Large v3

## Deployment

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t navigator-console .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Manual Deployment

1. **Install dependencies**
   ```bash
   npm ci
   ```

2. **Build the application**
   ```bash
   npm run build
   ```

3. **Run database migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start the server**
   ```bash
   npm start
   ```

## Monitoring

- Health check endpoint: `GET /api/status`
- Database monitoring via Prisma Studio: `npm run db:studio`
- Redis monitoring via Docker logs: `docker-compose logs redis`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please open a GitHub issue or contact the development team.