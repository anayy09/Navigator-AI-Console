// test-redis.js
const Redis = require('ioredis');

async function testRedis() {
  const redis = new Redis('redis://localhost:6379');
  
  try {
    const response = await redis.ping();
    console.log('✅ Redis is running! Response:', response);
    await redis.set('test', 'hello');
    const value = await redis.get('test');
    console.log('✅ Redis test data:', value);
    await redis.del('test');
    console.log('✅ Redis is working properly!');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  } finally {
    redis.disconnect();
  }
}

testRedis();
