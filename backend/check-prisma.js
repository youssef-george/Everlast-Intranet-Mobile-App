require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const models = Object.getOwnPropertyNames(prisma).filter(n => 
    !n.startsWith('$') && 
    !n.startsWith('_') && 
    typeof prisma[n] === 'object' && 
    prisma[n] !== null && 
    typeof prisma[n].findMany === 'function'
);

console.log('========================================');
console.log('Prisma Client Models Check');
console.log('========================================');
console.log('Available models:', models.join(', '));
console.log('Has quickLink:', models.includes('quickLink'));
console.log('quickLink value:', prisma.quickLink ? 'EXISTS' : 'UNDEFINED');

if (prisma.quickLink) {
    console.log('quickLink methods:', Object.keys(prisma.quickLink).slice(0, 5).join(', '));
} else {
    console.log('❌ quickLink model is missing!');
    console.log('All properties:', Object.getOwnPropertyNames(prisma).filter(n => !n.startsWith('$')).join(', '));
}

prisma.$disconnect();

