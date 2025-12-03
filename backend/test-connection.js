// Test database connection
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
console.log('Full URL:', process.env.DATABASE_URL);
console.log('\nTesting connection...\n');

const prisma = new PrismaClient();

prisma.$connect()
  .then(() => {
    console.log('✅ Connection successful!');
    return prisma.$disconnect();
  })
  .catch(err => {
    console.error('❌ Connection failed:');
    console.error('Error:', err.message);
    console.error('\nFull error:', err);
    process.exit(1);
  });
