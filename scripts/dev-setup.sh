#!/bin/bash
set -e

echo "🔧 Setting up development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️ Setting up database..."
npx prisma migrate dev

# Seed database (optional)
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Development environment ready!"
echo "🌟 Run 'npm run dev' to start the development server"